import {
  Component,
  computed,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ArrowIcon } from '../arrow-icon/arrow-icon';
import { PauseOffscreenVideo } from '../../directives/pause-offscreen-video';
import { I18nService } from '../../services/i18n.service';

export interface ProjectMedia {
  type: 'video' | 'image';
  src: string;
}

/**
 * A resource tile in the detail gallery:
 *  - 'video' → a short looping functionality clip (opens large in the lightbox)
 *  - 'cycle' → a set of vector images (brand marks / illustrations) that cross-fade
 */
export interface GalleryTile {
  kind: 'video' | 'cycle';
  src?: string;
  images?: string[];
  /** Recolor light/white vector art to dark so it reads on the light plate. */
  darken?: boolean;
}

export interface Project {
  id: string;
  title: string;
  /** Brief one-liner shown under the title in the index. */
  subtitle: string;
  problem: string;
  solution: string;
  /** What I did on the project. */
  role: string;
  tools: string[];
  githubUrl?: string;
  liveUrl?: string;
  /** Interactive walkthrough / prototype link. */
  demoUrl?: string;
  /** Optional reference link (e.g. the original work this is based on). */
  refUrl?: { label: string; href: string };
  /** Large preview (also used for the hover preview card). */
  preview?: ProjectMedia;
  /** Resource tiles shown in the expanded detail. */
  gallery?: GalleryTile[];
}

/** Asset roots. */
const PV = 'assets/images/projects/previsar/';
const LCC = 'assets/images/projects/lcc/';
const TEG = 'assets/images/projects/teg/';
const VD = 'assets/video/';

/**
 * Inline accordion index. Hovering a row pops a cursor-following video preview;
 * clicking opens a rich detail panel in place (no modal). Screenshot frames
 * cycle their images out of sync and open a full-screen lightbox on click.
 */
@Component({
  selector: 'app-projects',
  imports: [ArrowIcon, PauseOffscreenVideo],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class ProjectsSection implements OnDestroy {
  private readonly openIds = signal<ReadonlySet<string>>(new Set());
  private readonly reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  /** Project whose hover preview is currently showing (null = none). */
  readonly hoverProject = signal<Project | null>(null);
  @ViewChild('hoverPreview') private hoverPreview?: ElementRef<HTMLElement>;
  private moveHandler?: (e: MouseEvent) => void;

  /** Open lightbox gallery (functionality videos) — null when closed. */
  readonly lightbox = signal<{ videos: string[]; index: number } | null>(null);
  @ViewChild('lightboxEl') private lightboxEl?: ElementRef<HTMLElement>;
  private keyHandler?: (e: KeyboardEvent) => void;

  readonly i18n = inject(I18nService);

  constructor(private ngZone: NgZone) {}

  /** Block + link labels per language. */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? {
          problem: '[ Problema ]',
          solution: '[ Solución ]',
          role: '[ Rol ]',
          tools: '[ Herramientas ]',
          demo: 'Demo interactiva',
          github: 'Ver en GitHub',
          live: 'Sitio en vivo',
        }
      : {
          problem: '[ Problem ]',
          solution: '[ Solution ]',
          role: '[ Role ]',
          tools: '[ Tools ]',
          demo: 'Interactive demo',
          github: 'See on Github',
          live: 'Live site',
        },
  );

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  // ── Hover preview card (follows the cursor) ────────────────────

  onHover(project: Project, ev: MouseEvent): void {
    if (project.preview?.type !== 'video' || this.isOpen(project.id)) return;
    this.hoverProject.set(project);
    this.ngZone.runOutsideAngular(() => {
      this.position(ev.clientX, ev.clientY);
      this.moveHandler = (e) => this.position(e.clientX, e.clientY);
      document.addEventListener('mousemove', this.moveHandler);
    });
  }

  onLeave(): void {
    if (!this.hoverProject()) return;
    this.hoverProject.set(null);
    this.detachMove();
  }

  private position(x: number, y: number): void {
    const el = this.hoverPreview?.nativeElement;
    if (el) el.style.transform = `translate(${x + 24}px, ${y - 70}px)`;
  }

  private detachMove(): void {
    if (this.moveHandler) {
      document.removeEventListener('mousemove', this.moveHandler);
      this.moveHandler = undefined;
    }
  }

  // ── Gallery video tiles (play on hover only) ──────────────────

  onTileEnter(ev: Event): void {
    const v = (ev.currentTarget as HTMLElement).querySelector('video');
    if (v) void v.play().catch(() => {});
  }

  onTileLeave(ev: Event): void {
    const v = (ev.currentTarget as HTMLElement).querySelector('video');
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  // ── Functionality-video lightbox ───────────────────────────────

  /** The gallery's functionality clips, in order. */
  private galleryVideos(project: Project): string[] {
    return (project.gallery ?? [])
      .filter((t) => t.kind === 'video' && t.src)
      .map((t) => t.src!);
  }

  openVideoLightbox(project: Project, src: string, ev: MouseEvent): void {
    ev.stopPropagation();
    const videos = this.galleryVideos(project);
    if (!videos.length) return;

    const index = Math.max(0, videos.indexOf(src));
    this.lightbox.set({ videos, index });

    this.keyHandler = (e) => this.onLightboxKey(e);
    document.addEventListener('keydown', this.keyHandler);

    // Portal to <body> so the overlay escapes the content layer's stacking
    // context and covers everything (nav included). Retry until the @if view
    // has rendered, then focus for a11y.
    const portal = () => {
      if (!this.lightbox()) return;
      const el = this.lightboxEl?.nativeElement;
      if (!el) {
        requestAnimationFrame(portal);
        return;
      }
      if (el.parentElement !== document.body) document.body.appendChild(el);
      el.focus();
    };
    requestAnimationFrame(portal);
  }

  lightboxNext(ev?: Event): void {
    ev?.stopPropagation();
    const lb = this.lightbox();
    if (!lb) return;
    this.lightbox.set({ ...lb, index: (lb.index + 1) % lb.videos.length });
  }

  lightboxPrev(ev?: Event): void {
    ev?.stopPropagation();
    const lb = this.lightbox();
    if (!lb) return;
    this.lightbox.set({ ...lb, index: (lb.index - 1 + lb.videos.length) % lb.videos.length });
  }

  closeLightbox(): void {
    if (!this.lightbox()) return;
    this.lightbox.set(null);
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
  }

  onLightboxKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.closeLightbox();
    else if (e.key === 'ArrowRight') this.lightboxNext();
    else if (e.key === 'ArrowLeft') this.lightboxPrev();
  }

  // ── Expand / collapse ──────────────────────────────────────────

  /**
   * Toggles a project open/closed. The `is-open` class (signal-driven) fades the
   * content in/out; the panel's height is animated with GSAP (measured natural
   * height ↔ 0), which is far more reliable than the CSS grid-rows trick.
   */
  toggle(id: string, wrap: HTMLElement): void {
    const willOpen = !this.openIds().has(id);
    const next = new Set(this.openIds());
    if (willOpen) next.add(id);
    else next.delete(id);
    this.openIds.set(next);

    // Opening a row shouldn't leave its hover preview stuck on screen.
    if (willOpen) this.onLeave();

    if (this.reduceMotion) {
      wrap.style.height = willOpen ? 'auto' : '0';
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      gsap.killTweensOf(wrap);
      if (willOpen) {
        gsap.set(wrap, { height: 'auto' });
        const target = wrap.offsetHeight;
        gsap.fromTo(
          wrap,
          { height: 0 },
          {
            height: target,
            duration: 0.55,
            ease: 'power3.inOut',
            onComplete: () => {
              wrap.style.height = 'auto';
            },
          },
        );
      } else {
        gsap.fromTo(
          wrap,
          { height: wrap.offsetHeight },
          { height: 0, duration: 0.45, ease: 'power3.inOut' },
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.detachMove();
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
  }

  /** Language-reactive project list: English base + Spanish text overlay. */
  readonly projects = computed<Project[]>(() => {
    if (this.i18n.lang() !== 'es') return this.projectsEn;
    return this.projectsEn.map((p) => {
      const o = this.esOverrides[p.id];
      if (!o) return p;
      return {
        ...p,
        title: o.title ?? p.title,
        subtitle: o.subtitle,
        problem: o.problem,
        solution: o.solution,
        role: o.role,
        tools: o.tools,
        refUrl: p.refUrl && o.refLabel ? { ...p.refUrl, label: o.refLabel } : p.refUrl,
      };
    });
  });

  private readonly projectsEn: Project[] = [
    {
      id: 'P-01',
      title: 'PreVisar',
      subtitle: 'Pre-checking professional case files, automatically',
      problem:
        'Professional case files are bundles of separate documents, and they often arrive with avoidable problems — wrong formats, low-quality scans, inconsistent amounts, missing pieces. Reviewers spend their time on administrative checks instead of the technical content, slowing the process down and hurting the applicants waiting on it.',
      solution:
        'A web app that validates each file before it reaches a reviewer — checking format, scan quality, amount coherence and completeness, and flagging what is wrong. Reviewers get clean submissions and can focus on the expertise only they can provide.',
      role: 'Sole developer — I designed and built the whole product end to end, front to back, using an AI-assisted workflow.',
      tools: ['Angular', 'Spring Boot', 'Java', 'Docker', 'AI APIs', 'Mercado Pago', 'GitHub', 'Jira', 'UX/UI Design'],
      githubUrl: 'https://github.com/sofiacirioni/TFI-PreVisar',
      demoUrl: 'https://app.supademo.com/demo/cmsm5q5x30uf7qmij9lfva95p?utm_source=link',
      preview: { type: 'video', src: VD + 'previsar-demo.mp4' },
      // Three short functionality clips + one vector tile that cycles the brand
      // mark → wordmark → two unDraw illustrations.
      gallery: [
        { kind: 'video', src: VD + 'previsar-expediente.mp4' },
        { kind: 'video', src: VD + 'previsar-pago.mp4' },
        { kind: 'video', src: VD + 'previsar-revisor.mp4' },
        { kind: 'cycle', images: [PV + 'previsar-mark.svg', PV + 'previsar-wordmark.svg', PV + 'login.svg', PV + 'revisar.svg'] },
      ],
    },
    {
      id: 'P-02',
      title: 'TEG online',
      subtitle: 'The war-strategy board game, online',
      problem:
        'TEG is a tactics-and-strategy war game built to be played around a table — but getting everyone in the same room is the hard part.',
      solution:
        "A web version you can play with friends through a room code, or against bots. It faithfully adapts Yetem's classic board game and stages the whole experience in a 20th-century wartime setting — pulling the player into the conflict in first person, through a custom design system and hand-crafted assets.",
      role: 'Academic group project I later took over on my own — refactoring the entire front-end, finishing incomplete features, and creating the whole design system and assets with AI tools.',
      tools: ['Angular', 'Java', 'Spring Boot', 'Docker', 'UX/UI Design', 'AI (imagery & development)'],
      githubUrl: 'https://github.com/sofiacirioni/2025-TPI-TEG',
      refUrl: { label: 'Original game by Yetem', href: 'https://yetem.com/juegos/t-e-g-tradicional/' },
      preview: { type: 'video', src: VD + 'teg-preview.mp4' },
      // Three functionality clips (create game, gameplay, victory) + one tile
      // that cycles the custom game assets: emblem, medal and hand cursors.
      gallery: [
        { kind: 'video', src: VD + 'teg-crear-partida.mp4' },
        { kind: 'video', src: VD + 'teg-partida.mp4' },
        { kind: 'video', src: VD + 'teg-win.mp4' },
        {
          kind: 'cycle',
          images: [
            TEG + 'teg-logo.webp',
            TEG + 'teg-medal.webp',
            TEG + 'teg-cursor-default.svg',
            TEG + 'teg-cursor-pointer.svg',
          ],
        },
      ],
    },
    {
      id: 'P-03',
      title: 'Lab management\nsystem',
      subtitle: 'Running a clinical laboratory end to end',
      problem:
        'A clinical lab juggles a lot at once — patients, appointments, sample tracking, stock, users, health insurers, referrals — usually spread across disconnected tools, which makes traceability and the day-to-day harder than it should be.',
      solution:
        'A web platform with a microservices backend that brings it all into one system: patients, appointments, sample tracking, stock, user management, health insurers and referrals.',
      role: 'Academic group project — as the developer on the user-management team, I worked mostly on the front-end: the login, the user panel, and authentication with route guards.',
      tools: ['Angular', 'Java', 'Spring Boot', 'Microservices', 'Docker', 'GitHub'],
      preview: { type: 'video', src: VD + 'lcc-project-preview.mp4' },
      // Three functionality clips + a tile with the (white) lab logo, recolored
      // dark so it reads on the light plate. Repo is private → no links.
      gallery: [
        { kind: 'video', src: VD + 'lcc-login.mp4' },
        { kind: 'video', src: VD + 'lcc-portal-paciente.mp4' },
        { kind: 'video', src: VD + 'lcc-recorrido-interno-vacio.mp4' },
        { kind: 'cycle', darken: true, images: [LCC + 'lcc-logo.png'] },
      ],
    },
  ];

  /** Spanish text overlay, merged onto the English base by `projects`. */
  private readonly esOverrides: Record<
    string,
    {
      title?: string;
      subtitle: string;
      problem: string;
      solution: string;
      role: string;
      tools: string[];
      refLabel?: string;
    }
  > = {
    'P-01': {
      subtitle: 'Pre-chequeo automático de expedientes profesionales',
      problem:
        'Los expedientes profesionales son conjuntos de documentos separados, y suelen llegar con problemas evitables — formatos incorrectos, escaneos de baja calidad, montos inconsistentes, piezas faltantes. Los revisores gastan su tiempo en chequeos administrativos en lugar del contenido técnico, ralentizando el proceso y perjudicando a quienes esperan por él.',
      solution:
        'Una app web que valida cada archivo antes de que llegue a un revisor — chequeando formato, calidad de escaneo, coherencia de montos y completitud, y marcando lo que está mal. Los revisores reciben archivos limpios y pueden enfocarse en el contenido técnico.',
      role: 'Desarrolladora única — diseñé y construí todo el producto de punta a punta, del front al back, con un flujo asistido por IA.',
      tools: ['Angular', 'Spring Boot', 'Java', 'Docker', 'APIs de IA', 'Mercado Pago', 'GitHub', 'Jira', 'Diseño UX/UI'],
    },
    'P-02': {
      subtitle: 'El juego de mesa de estrategia bélica, online',
      problem:
        'TEG es un juego de guerra de táctica y estrategia pensado para jugarse alrededor de una mesa — pero juntar a todos en la misma sala es lo difícil.',
      solution:
        'Una versión web para jugar con amigos mediante un código de sala, o contra bots. Adapta fielmente el clásico juego de mesa de Yetem y ambienta toda la experiencia en un contexto bélico del siglo XX — metiendo al jugador en el conflicto en primera persona, a través de un sistema de diseño propio y assets hechos a mano.',
      role: 'Proyecto académico grupal que después tomé por mi cuenta — refactorizando todo el front-end, terminando funcionalidades incompletas y creando todo el sistema de diseño y los assets con herramientas de IA.',
      tools: ['Angular', 'Java', 'Spring Boot', 'Docker', 'Diseño UX/UI', 'IA (imágenes y desarrollo)'],
      refLabel: 'Juego original de Yetem',
    },
    'P-03': {
      title: 'Sistema de gestión\nde laboratorio',
      subtitle: 'Gestión integral de un laboratorio clínico',
      problem:
        'Un laboratorio clínico maneja muchas cosas a la vez — pacientes, turnos, seguimiento de muestras, stock, usuarios, obras sociales, derivaciones — normalmente repartidas en herramientas desconectadas, lo que hace la trazabilidad y el día a día más difíciles de lo que deberían.',
      solution:
        'Una plataforma web con backend de microservicios que unifica todo en un solo sistema: pacientes, turnos, seguimiento de muestras, stock, gestión de usuarios, obras sociales y derivaciones.',
      role: 'Proyecto académico grupal — como desarrolladora del equipo de gestión de usuarios, trabajé principalmente en el front-end: el login, el panel de usuarios y la autenticación con guards de ruta.',
      tools: ['Angular', 'Java', 'Spring Boot', 'Microservicios', 'Docker', 'GitHub'],
    },
  };
}
