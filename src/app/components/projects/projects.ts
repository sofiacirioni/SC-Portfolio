import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  NgZone,
  OnDestroy,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import gsap from 'gsap';
import { SmoothScrollService } from '../../services/smooth-scroll.service';

export interface Project {
  id: string;
  title: string;
  /** Brief one-liner shown next to the title at the page center. */
  subtitle: string;
  problem: string;
  solution: string;
  tools: string[];
  githubUrl?: string;
  liveUrl?: string;
}

/**
 * Scroll-center reveal: project images flow past in alternating left/right
 * columns. When an image aligns with the vertical center of the viewport its
 * name + subtitle fade in at the center (the name stays centered, the images
 * move). Clicking an image expands it to the center (FLIP) and reveals the
 * problem / solution / tools detail. Centre detection is an IntersectionObserver
 * with a thin band at the viewport middle — no per-frame work.
 *
 * State lives in signals so the view updates from async callbacks (gsap
 * onComplete, IntersectionObserver) under the app's zoneless change detection.
 */
@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class ProjectsSection implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl') private sectionEl!: ElementRef<HTMLElement>;
  @ViewChildren('projectImg') private imgEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('detailImg') private detailImgRef?: ElementRef<HTMLElement>;
  @ViewChild('detailBody') private detailBodyRef?: ElementRef<HTMLElement>;
  @ViewChild('overlayDim') private dimRef?: ElementRef<HTMLElement>;
  @ViewChild('dialogEl') private dialogRef?: ElementRef<HTMLElement>;

  readonly activeId = signal<string | null>(null);
  readonly centerVisible = signal(false);
  readonly openProject_ = signal<Project | null>(null);
  readonly activeProject = computed(
    () => this.projects.find((p) => p.id === this.activeId()) ?? null,
  );

  private centerObserver?: IntersectionObserver;
  private flipSource: HTMLElement | null = null;
  private reduceMotion = false;

  constructor(
    private ngZone: NgZone,
    private smoothScroll: SmoothScrollService,
  ) {}

  readonly projects: Project[] = [
    {
      id: 'P-01',
      title: 'Laboratory system',
      subtitle: 'Centralizing samples & results for a real lab',
      problem: 'Manual workflows, records scattered across spreadsheets, and no traceability between a sample and its result.',
      solution: 'A web system that centralizes samples and results with role-based access, so each step is logged and searchable.',
      tools: ['Angular', 'Spring', 'UI Design'],
      githubUrl: '#',
    },
    {
      id: 'P-02',
      title: 'Project two',
      subtitle: 'A compact brand design system',
      problem: 'The brand had no consistent visual identity — every piece looked like it came from a different place.',
      solution: 'A small, opinionated design system: type scale, color, and a handful of reusable components.',
      tools: ['UI Design', 'Branding'],
    },
    {
      id: 'P-03',
      title: 'Project three',
      subtitle: 'A faster, team-editable site',
      problem: 'The client site was slow and could only be updated by a developer.',
      solution: 'Rebuilt the front-end to be lighter and editable by the team without touching code.',
      tools: ['Front-end', 'UI Design'],
      githubUrl: '#',
    },
    {
      id: 'P-04',
      title: 'Project four',
      subtitle: 'A full-stack prototype, end to end',
      problem: 'A course project with a real-world constraint and a tight deadline.',
      solution: 'A full-stack prototype taken from idea to working demo, owning both data and interface.',
      tools: ['Full-stack'],
    },
  ];

  ngAfterViewInit(): void {
    this.reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.setupCenterObserver();
  }

  ngOnDestroy(): void {
    this.centerObserver?.disconnect();
    this.smoothScroll.start();
  }

  /** Marks the project whose image straddles the viewport center as active. */
  private setupCenterObserver(): void {
    this.centerObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset['id'] ?? null;
          if (entry.isIntersecting) {
            this.activeId.set(id);
            this.centerVisible.set(true);
          } else if (this.activeId() === id) {
            this.centerVisible.set(false);
          }
        }
      },
      { rootMargin: '-49% 0px -49% 0px', threshold: 0 },
    );
    this.imgEls.forEach((ref) => this.centerObserver!.observe(ref.nativeElement));
  }

  onDialogKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') this.closeProject();
  }

  openProject(project: Project, ev: Event): void {
    this.flipSource = ev.currentTarget as HTMLElement;
    this.openProject_.set(project);
    this.smoothScroll.stop();

    if (this.reduceMotion) {
      requestAnimationFrame(() => this.dialogRef?.nativeElement.focus());
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.dialogRef?.nativeElement.focus();
        const src = this.flipSource!.getBoundingClientRect();
        const img = this.detailImgRef?.nativeElement;
        const body = this.detailBodyRef?.nativeElement;
        const dim = this.dimRef?.nativeElement;

        if (dim) gsap.fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });

        if (img) {
          const dst = img.getBoundingClientRect();
          gsap.fromTo(
            img,
            {
              x: src.left - dst.left,
              y: src.top - dst.top,
              scaleX: src.width / dst.width,
              scaleY: src.height / dst.height,
              transformOrigin: 'top left',
            },
            { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power3.inOut' },
          );
        }

        if (body) {
          gsap.fromTo(
            body,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, delay: 0.25, ease: 'power3.out' },
          );
        }
      });
    });
  }

  closeProject(): void {
    if (this.openProject_() === null) return;
    this.smoothScroll.start();

    if (this.reduceMotion || !this.flipSource) {
      this.openProject_.set(null);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const img = this.detailImgRef?.nativeElement;
      const body = this.detailBodyRef?.nativeElement;
      const dim = this.dimRef?.nativeElement;
      const src = this.flipSource!.getBoundingClientRect();

      if (body) gsap.to(body, { opacity: 0, y: 10, duration: 0.25, ease: 'power2.in' });

      if (img) {
        const dst = img.getBoundingClientRect();
        gsap.to(img, {
          x: src.left - dst.left,
          y: src.top - dst.top,
          scaleX: src.width / dst.width,
          scaleY: src.height / dst.height,
          transformOrigin: 'top left',
          duration: 0.5,
          ease: 'power3.inOut',
        });
      }

      const finish = () => {
        if (img) gsap.set(img, { clearProps: 'all' });
        this.openProject_.set(null);
      };

      if (dim) {
        gsap.to(dim, { opacity: 0, duration: 0.45, delay: 0.05, onComplete: finish });
      } else {
        finish();
      }
    });
  }
}
