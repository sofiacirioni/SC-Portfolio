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
const SPEED_MULTIPLIER = 3;

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
  private positions: number[] = [];
  private copyWidths: number[] = [];

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

    this.trackEls = Array.from(
      wrapper.querySelectorAll<HTMLElement>('.ticker-track'),
    );

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
      if (speed < 0.01) return;

      this.trackEls.forEach((track, i) => {
        const w = this.copyWidths[i];
        if (w === 0) return;

        // Position always advances 0 → w then wraps seamlessly
        this.positions[i] = (this.positions[i] + speed) % w;

        const dir = this.rows[i]?.direction ?? 1;
        if (dir === 1) {
          // Left: translateX goes 0 → -w
          track.style.transform = `translateX(-${this.positions[i]}px)`;
        } else {
          // Right: translateX goes -w → 0 (rightward)
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
