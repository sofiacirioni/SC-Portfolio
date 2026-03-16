import { DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-home',
  imports: [Nav, Hero, ScramblePhraseComponent, PillBtnComponent, TickerTapeComponent, About, ProjectsSection, ContactSection, SiteFooter],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'Inspire' }],
    [{ text: 'through' }, { text: 'design' }],
  ];

  phraseReady = false;

  /**
   * 4 full-width ticker rows (100vw).
   * Positioned at the Hero/About boundary — span both sections visually.
   */
  readonly fullTickerRows: TickerRow[] = [
    {
      text: '// MAKING ENJOYABLE INTERFACES // THINKING IN USABILITY AND ACCESIBILITY',
      direction: 1,
    },
    { text: '// PLANING WAYS TO GUIDE THE USER', direction: -1 },
    {
      text: '// DESIGNING TO EMPHATIZE // enjoy doing unconventional designs conventionally',
      direction: 1,
    },
    { text: '// NECESITIES-CENTER MINDSET', direction: -1 },
  ];

  constructor() {
    this.doc.body.style.overflow = 'hidden';
  }

  onPhraseComplete(): void {
    this.phraseReady = true;
    this.doc.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }
}
