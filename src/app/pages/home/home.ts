import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SmoothScrollService } from '../../services/smooth-scroll.service';
import { Nav } from '../../components/nav/nav';
import { Hero } from '../../components/hero/hero';
import {
  ScramblePhraseComponent,
  ScrambleWordDef,
} from '../../components/scramble-phrase/scramble-phrase';
import { PillBtnComponent } from '../../components/pill-btn/pill-btn';
import {
  TickerTapeComponent,
  TickerRow,
} from '../../components/ticker-tape/ticker-tape';
import { About } from '../../components/about/about';
import { ProjectsSection } from '../../components/projects/projects';
import { ContactSection } from '../../components/contact/contact';
import { SiteFooter } from '../../components/footer/footer';
import { ArrowIcon } from '../../components/arrow-icon/arrow-icon';

@Component({
  selector: 'app-home',
  imports: [Nav, Hero, ScramblePhraseComponent, PillBtnComponent, TickerTapeComponent, About, ProjectsSection, ContactSection, SiteFooter, ArrowIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly ngZone = inject(NgZone);

  @ViewChildren('introMask') private introMasks!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('heroBackdrop') private heroBackdrop!: ElementRef<HTMLElement>;
  @ViewChild('footerAnchor', { read: ElementRef })
  private footerAnchor!: ElementRef<HTMLElement>;
  private introObserver?: IntersectionObserver;
  private backdropFade?: ScrollTrigger;

  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'From' }, { text: 'the' }, { text: 'clouds', font: 'serif' }],
    [{ text: 'to' }, { text: 'the' }, { text: 'code' }],
  ];

  phraseReady = false;

  /**
   * 4 full-width ticker rows (100vw).
   * Positioned at the Hero/About boundary — span both sections visually.
   */
  readonly fullTickerRows: TickerRow[] = [
    {
      text: '// MAKING ENJOYABLE INTERFACES // THINKING IN USABILITY AND ACCESSIBILITY',
      direction: 1,
    },
    {
      text: '// DESIGNING TO EMPATHIZE // enjoy doing unconventional designs conventionally',
      direction: -1,
    },
  ];

  ngAfterViewInit(): void {
    this.smoothScroll.init();
    this.setupIntroReveal();
    this.setupBackdropFade();
  }

  /**
   * Fades the fixed ASCII backdrop out as the footer scrolls into view, so the
   * closing section reads as a clean opaque sheet instead of the band lingering
   * pinned near the top. Scrubbed → tied directly to scroll position.
   */
  private setupBackdropFade(): void {
    const backdrop = this.heroBackdrop?.nativeElement;
    const footer = this.footerAnchor?.nativeElement;
    if (!backdrop || !footer) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    this.ngZone.runOutsideAngular(() => {
      const tween = gsap.to(backdrop, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          end: 'top 40%',
          scrub: true,
        },
      });
      this.backdropFade = tween.scrollTrigger;
    });
  }

  /** Reveals the CTA + scroll hint once the hero phrase finishes scrambling. */
  onPhraseComplete(): void {
    this.phraseReady = true;
  }

  /** Clip-path mask reveal for the projects intro line (staggered per line). */
  private setupIntroReveal(): void {
    const masks = this.introMasks.map((r) => r.nativeElement);
    const line = masks[0]?.parentElement;
    if (!line) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(masks, { clipPath: 'inset(0 0% 0 0)' });
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.introObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(masks, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.15,
              overwrite: true,
            });
          } else {
            gsap.to(masks, {
              clipPath: 'inset(0 100% 0 0)',
              duration: 0.4,
              ease: 'power2.in',
              overwrite: true,
            });
          }
        },
        { threshold: 0.6 },
      );
      this.introObserver.observe(line);
    });
  }

  ngOnDestroy(): void {
    this.smoothScroll.destroy();
    this.introObserver?.disconnect();
    this.backdropFade?.kill();
  }
}
