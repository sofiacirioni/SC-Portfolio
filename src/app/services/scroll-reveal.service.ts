import { inject, Injectable, NgZone } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class ScrollRevealService {
  private readonly ngZone = inject(NgZone);

  /**
   * Sequential scroll reveal: each group animates after the previous one,
   * staggered by `staggerDelay` seconds. All groups share the same trigger
   * element (usually the section). Re-triggers on every viewport crossing.
   *
   * Groups are arrays of elements that animate simultaneously within each step.
   */
  revealSequential(
    trigger: HTMLElement,
    groups: HTMLElement[][],
    staggerDelay = 0.18,
  ): () => void {
    const allEls = groups.flat();
    gsap.set(allEls, { opacity: 0 });

    let tweens: gsap.core.Tween[] = [];
    let observer: IntersectionObserver;

    this.ngZone.runOutsideAngular(() => {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          tweens.forEach((t) => t.kill());
          tweens = [];

          if (entry.isIntersecting) {
            const fromBelow = entry.boundingClientRect.top >= 0;
            gsap.set(allEls, { y: fromBelow ? 48 : -48 });
            groups.forEach((group, i) => {
              const tween = gsap.to(group, {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                delay: i * staggerDelay,
              });
              tweens.push(tween);
            });
          } else {
            const exitY = entry.boundingClientRect.bottom <= 0 ? -48 : 48;
            gsap.set(allEls, { opacity: 0, y: exitY });
          }
        },
        { threshold: 0.08 },
      );

      observer.observe(trigger);
    });

    return () => {
      observer?.disconnect();
      tweens.forEach((t) => t.kill());
      gsap.set(allEls, { clearProps: 'opacity,transform' });
    };
  }

  /**
   * Bidirectional scroll reveal: opacity 0→1 + translateY ±48→0 each time
   * the element enters the viewport. Direction is derived from which edge
   * the element enters from (top or bottom).
   *
   * The animation re-triggers every time the element enters, so scrolling
   * back up re-plays the reveal from the correct direction.
   *
   * Runs entirely outside Angular's zone. Returns a cleanup function for ngOnDestroy.
   */
  reveal(el: HTMLElement): () => void {
    // Start invisible but at natural layout position — no y offset here to
    // avoid spurious scrollHeight expansion before the animation fires.
    gsap.set(el, { opacity: 0 });

    let tween: gsap.core.Tween | null = null;
    let observer: IntersectionObserver;

    this.ngZone.runOutsideAngular(() => {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          tween?.kill();

          if (entry.isIntersecting) {
            // boundingClientRect.top >= 0  →  element entering from below (scroll down)
            // boundingClientRect.top <  0  →  element entering from above (scroll up)
            const fromBelow = entry.boundingClientRect.top >= 0;
            gsap.set(el, { y: fromBelow ? 48 : -48 });
            tween = gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
            });
          } else {
            // Leaving viewport — reset immediately so next reveal is correct.
            // bottom <= 0  →  exited above viewport (user scrolled down past it)
            // bottom >  0  →  exited below viewport (user scrolled up past it)
            const exitY = entry.boundingClientRect.bottom <= 0 ? -48 : 48;
            gsap.set(el, { opacity: 0, y: exitY });
          }
        },
        { threshold: 0.12 },
      );

      observer.observe(el);
    });

    return () => {
      observer?.disconnect();
      tween?.kill();
      gsap.set(el, { clearProps: 'opacity,transform' });
    };
  }
}
