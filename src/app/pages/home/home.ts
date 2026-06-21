import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
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
  private readonly doc = inject(DOCUMENT);
  private readonly smoothScroll = inject(SmoothScrollService);

  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'design' }, { text: 'that' }],
    [{ text: 'inspires', font: 'serif' }],
  ];

  phraseReady = false;

  /**
   * Safety net: if the hero scramble never emits `complete` (e.g. fonts fail
   * to load), the body would stay scroll-locked forever. This timer unlocks
   * it unconditionally after a max wait.
   */
  private readonly SCROLL_UNLOCK_FALLBACK_MS = 8000;
  private unlockFallbackTimer: ReturnType<typeof setTimeout> | null = null;

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

  constructor() {
    this.doc.body.style.overflow = 'hidden';
    this.unlockFallbackTimer = setTimeout(
      () => this.unlockScroll(),
      this.SCROLL_UNLOCK_FALLBACK_MS,
    );
  }

  ngAfterViewInit(): void {
    // Lenis owns scrolling from here; keep it stopped while the intro is locked.
    this.smoothScroll.init();
    this.smoothScroll.stop();
  }

  onPhraseComplete(): void {
    this.phraseReady = true;
    this.unlockScroll();
  }

  private unlockScroll(): void {
    this.doc.body.style.overflow = '';
    this.smoothScroll.start();
    if (this.unlockFallbackTimer !== null) {
      clearTimeout(this.unlockFallbackTimer);
      this.unlockFallbackTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
    this.smoothScroll.destroy();
  }
}
