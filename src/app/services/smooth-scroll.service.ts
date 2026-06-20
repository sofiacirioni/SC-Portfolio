import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';
import gsap from 'gsap';
import Lenis from 'lenis';

/**
 * Wraps Lenis for inertial smooth scrolling, driven by the GSAP ticker so it
 * stays in sync with the rest of the animations. In-page anchor links
 * (#about, #projects, #top, …) are intercepted globally and animated through
 * Lenis instead of jumping. Respects `prefers-reduced-motion` (no-op).
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly ngZone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);

  private lenis: Lenis | null = null;
  private tickerFn: ((time: number) => void) | null = null;
  private anchorHandler: ((e: Event) => void) | null = null;

  private prefersReducedMotion(): boolean {
    return this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  init(): void {
    if (this.lenis || this.prefersReducedMotion()) return;

    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.1, smoothWheel: true });

      // Drive Lenis from GSAP's ticker (single rAF loop for everything).
      this.tickerFn = (time: number) => this.lenis?.raf(time * 1000);
      gsap.ticker.add(this.tickerFn);
      gsap.ticker.lagSmoothing(0);

      // Smooth in-page anchor navigation (nav, pill buttons, footer go-top).
      this.anchorHandler = (e: Event) => {
        const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
        const href = link?.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        // Lenis resolves the selector string itself — no manual DOM query needed.
        this.lenis?.scrollTo(href, { offset: -32 });
      };
      this.doc.addEventListener('click', this.anchorHandler);
    });
  }

  /** Locks scrolling (used during the hero intro). */
  stop(): void {
    this.lenis?.stop();
  }

  /** Releases the scroll lock. */
  start(): void {
    this.lenis?.start();
  }

  destroy(): void {
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    if (this.anchorHandler) this.doc.removeEventListener('click', this.anchorHandler);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
