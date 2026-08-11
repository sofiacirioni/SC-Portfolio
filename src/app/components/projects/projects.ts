import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ArrowIcon } from '../arrow-icon/arrow-icon';
import { PauseOffscreenVideo } from '../../directives/pause-offscreen-video';

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
  /** Large preview (also used for the hover preview card). */
  preview?: ProjectMedia;
  /** Resource tiles shown in the expanded detail. */
  gallery?: GalleryTile[];
}

/** Asset roots. */
const PV = 'assets/images/projects/previsar/';
const LCC = 'assets/images/projects/lcc/';
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

  constructor(private ngZone: NgZone) {}

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

  readonly projects: Project[] = [
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
    {
      id: 'P-03',
      title: 'TEG online',
      subtitle: 'The war-strategy board game, online',
      problem:
        'TEG is a tactics-and-strategy war game built to be played around a table — but getting everyone in the same room is the hard part.',
      solution:
        'A web version you can play with friends through a room code, or against bots — set in the 20th century and faithful to the classic analog game.',
      role: 'Academic group project I later took over on my own — refactoring the entire front-end, finishing incomplete features, and creating the whole design system and assets with AI tools.',
      tools: ['Angular', 'Java', 'Spring Boot', 'Docker', 'Design system'],
      githubUrl: 'https://github.com/sofiacirioni/2025-TPI-TEG',
    },
  ];
}
