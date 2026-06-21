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
  private readonly smoothScroll = inject(SmoothScrollService);

  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'design' }, { text: 'that' }],
    [{ text: 'inspires', font: 'serif' }],
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
  }

  /** Reveals the CTA + scroll hint once the hero phrase finishes scrambling. */
  onPhraseComplete(): void {
    this.phraseReady = true;
  }

  ngOnDestroy(): void {
    this.smoothScroll.destroy();
  }
}
