import {
  AfterViewInit,
  Component,
  computed,
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
import { I18nService } from '../../services/i18n.service';
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
  readonly i18n = inject(I18nService);

  @ViewChildren('introMask') private introMasks!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('heroBackdrop') private heroBackdrop!: ElementRef<HTMLElement>;
  @ViewChild('footerAnchor', { read: ElementRef })
  private footerAnchor!: ElementRef<HTMLElement>;
  private introObserver?: IntersectionObserver;
  private backdropFade?: ScrollTrigger;

  /** Hero phrase word defs per language (last accent word rendered in serif). */
  readonly phraseLines = computed<ScrambleWordDef[][]>(() =>
    this.i18n.lang() === 'es'
      ? [
          [{ text: 'La' }, { text: 'cabeza' }, { text: 'en' }, { text: 'las' }, { text: 'nubes,', font: 'serif' }],
          [{ text: 'las' }, { text: 'manos' }, { text: 'en' }, { text: 'el' }, { text: 'código.' }],
        ]
      : [
          [{ text: 'Head' }, { text: 'in' }, { text: 'the' }, { text: 'clouds,', font: 'serif' }],
          [{ text: 'hands' }, { text: 'in' }, { text: 'the' }, { text: 'code.' }],
        ],
  );

  /** Simple hero / intro copy per language. */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? {
          subline:
            'convirtiendo ideas dispersas en productos concretos a través del diseño y el código',
          cta: 'Ver proyectos',
          scroll: 'Desliza',
          introLabel: '[ Trabajo seleccionado ]',
          introLine1: 'Cada uno empezó siendo un caos.',
          introLine2: 'Acá es donde aterrizó.',
        }
      : {
          subline:
            'turning scattered ideas into concrete products through design and code',
          cta: 'See projects',
          scroll: 'Scroll',
          introLabel: '[ Selected work ]',
          introLine1: 'Each one started messy.',
          introLine2: 'This is where it landed.',
        },
  );

  phraseReady = false;

  /**
   * Full-width ticker rows positioned at the Hero/About boundary. Decorative
   * typographic texture — kept in English and all-caps for a single consistent
   * voice, regardless of the page language.
   */
  readonly fullTickerRows: TickerRow[] = [
    {
      text: '// MAKING ENJOYABLE INTERFACES // THINKING IN USABILITY AND ACCESSIBILITY',
      direction: 1,
    },
    {
      text: '// DESIGNING TO EMPATHIZE // UNCONVENTIONAL DESIGNS DONE CONVENTIONALLY',
      direction: -1,
    },
    {
      text: '// FROM SCATTERED IDEAS TO SHIPPED PRODUCTS // WHERE DESIGN MEETS CODE',
      direction: 1,
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
