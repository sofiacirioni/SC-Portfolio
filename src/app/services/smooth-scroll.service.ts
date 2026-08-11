import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Wraps Lenis for inertial smooth scrolling, driven by the GSAP ticker so it
 * stays in sync with the rest of the animations. ScrollTrigger is registered
 * here and fed Lenis' scroll position so scroll-driven animations (parallax,
 * pinned backdrop) stay perfectly in sync with the inertial scroll. In-page
 * anchor links (#about, #projects, #top, …) are intercepted globally and
 * animated through Lenis instead of jumping.
 *
 * `prefers-reduced-motion`: Lenis is skipped (native scroll), but ScrollTrigger
 * is still registered so components can attach scroll-driven reveals that read
 * native scroll directly.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly ngZone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);

  private lenis: Lenis | null = null;
  private tickerFn: ((time: number) => void) | null = null;
  private anchorHandler: ((e: Event) => void) | null = null;
  private initialized = false;

  private prefersReducedMotion(): boolean {
    return this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.ngZone.runOutsideAngular(() => {
      // Register once; safe to call repeatedly. Available even under reduced
      // motion (ScrollTrigger tracks native scroll fine without Lenis).
      gsap.registerPlugin(ScrollTrigger);

      if (this.prefersReducedMotion()) {
        ScrollTrigger.refresh();
        return;
      }

      this.lenis = new Lenis({ duration: 1.1, smoothWheel: true });

      // Keep ScrollTrigger's clock in step with Lenis' inertial position.
      this.lenis.on('scroll', ScrollTrigger.update);

      // Drive Lenis from GSAP's ticker (single rAF loop for everything).
      this.tickerFn = (time: number) => this.lenis?.raf(time * 1000);
      gsap.ticker.add(this.tickerFn);
      gsap.ticker.lagSmoothing(0);

      // Layout is fully in place once triggers are created — recompute starts.
      ScrollTrigger.refresh();

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

  /** Recomputes all ScrollTrigger start/end positions (call after layout shifts). */
  refresh(): void {
    ScrollTrigger.refresh();
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
    this.initialized = false;
  }
}
