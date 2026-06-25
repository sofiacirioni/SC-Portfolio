import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import gsap from 'gsap';
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
  private introObserver?: IntersectionObserver;

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
  }
}
