import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import gsap from 'gsap';

export interface TickerRow {
  text: string;
  /** 1 = move left (default), -1 = move right */
  direction?: 1 | -1;
}

/** How many pixel-equivalents of movement per unit of scroll velocity */
const SPEED_MULTIPLIER = 5;

@Component({
  selector: 'app-ticker-tape',
  templateUrl: './ticker-tape.html',
  styleUrl: './ticker-tape.css',
})
export class TickerTapeComponent implements AfterViewInit, OnDestroy {
  @Input() rows: TickerRow[] = [];
  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLElement>;

  /** Four copies per row so the track always overflows the viewport */
  readonly copies = [0, 1, 2, 3];

  private trackEls: HTMLElement[] = [];
  private rowEls: HTMLElement[] = [];
  private positions: number[] = [];
  private copyWidths: number[] = [];
  /** Per-row reveal progress 0→1; initialized with stagger offset */
  private revealProgress: number[] = [];
  private isRevealed: boolean[] = [];

  private scrollVelocity = 0;
  private lastScrollY = 0;
  private lastScrollTime = 0;

  private isVisible = false;
  private tickerFn?: () => void;
  private scrollHandler?: () => void;
  private resizeHandler?: () => void;
  private observer?: IntersectionObserver;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => this.init());
  }

  private init(): void {
    const wrapper = this.wrapperRef.nativeElement;

    this.rowEls = Array.from(wrapper.querySelectorAll<HTMLElement>('.ticker-row'));
    this.trackEls = Array.from(
      wrapper.querySelectorAll<HTMLElement>('.ticker-track'),
    );

    // Reveal progress: stagger each row by -0.25 so they enter sequentially
    this.revealProgress = this.rows.map((_, i) => -(i * 0.25));
    this.isRevealed = this.rows.map(() => false);

    // Set initial clip-path: each row hidden from its respective edge
    this.rowEls.forEach((rowEl, i) => {
      const dir = this.rows[i]?.direction ?? 1;
      rowEl.style.clipPath = dir === 1 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    });

    this.positions = this.rows.map(() => 0);
    this.measureCopyWidths();

    // ── Scroll velocity ──────────────────────────
    this.lastScrollY = window.scrollY;
    this.lastScrollTime = performance.now();

    this.scrollHandler = () => {
      const now = performance.now();
      const dy = window.scrollY - this.lastScrollY;
      const dt = Math.max(16, now - this.lastScrollTime);

      // Instantaneous velocity (px/ms), smoothed with a light lerp
      const instant = dy / dt;
      this.scrollVelocity = this.scrollVelocity * 0.6 + instant * 0.4;

      this.lastScrollY = window.scrollY;
      this.lastScrollTime = now;
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // ── Re-measure on resize ─────────────────────
    this.resizeHandler = () => this.measureCopyWidths();
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // ── Visibility guard (performance) ───────────
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    this.observer.observe(wrapper);

    // ── GSAP ticker loop ─────────────────────────
    this.tickerFn = () => {
      // Decay velocity whether visible or not
      this.scrollVelocity *= 0.88;

      if (!this.isVisible) return;

      const speed = Math.abs(this.scrollVelocity) * SPEED_MULTIPLIER;

      this.trackEls.forEach((track, i) => {
        const w = this.copyWidths[i];
        if (w === 0) return;

        const dir = this.rows[i]?.direction ?? 1;

        // ── Scroll-driven reveal ──
        // Progress driven by scroll velocity + tiny base so it eventually resolves
        if (!this.isRevealed[i]) {
          const step = Math.abs(this.scrollVelocity) * 0.04 + 0.0015;
          this.revealProgress[i] = Math.min(1, this.revealProgress[i] + step);

          const pct = this.revealProgress[i];
          if (pct > 0) {
            const hiddenPct = (1 - pct) * 100;
            this.rowEls[i].style.clipPath = dir === 1
              ? `inset(0 ${hiddenPct}% 0 0)`
              : `inset(0 0 0 ${hiddenPct}%)`;
          }
          if (pct >= 1) {
            this.isRevealed[i] = true;
            this.rowEls[i].style.clipPath = '';
          }
        }

        // ── Normal scroll movement ──
        if (speed < 0.01) return;

        this.positions[i] = (this.positions[i] + speed) % w;

        if (dir === 1) {
          track.style.transform = `translateX(-${this.positions[i]}px)`;
        } else {
          track.style.transform = `translateX(${this.positions[i] - w}px)`;
        }
      });
    };

    gsap.ticker.add(this.tickerFn);
  }

  private measureCopyWidths(): void {
    const wrapper = this.wrapperRef?.nativeElement;
    if (!wrapper) return;

    wrapper
      .querySelectorAll<HTMLElement>('.ticker-track')
      .forEach((track, i) => {
        const firstCopy = track.querySelector<HTMLElement>('.ticker-copy');
        this.copyWidths[i] = firstCopy?.offsetWidth ?? 0;
      });
  }

  ngOnDestroy(): void {
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    if (this.scrollHandler)
      window.removeEventListener('scroll', this.scrollHandler);
    if (this.resizeHandler)
      window.removeEventListener('resize', this.resizeHandler);
    this.observer?.disconnect();
  }
}
