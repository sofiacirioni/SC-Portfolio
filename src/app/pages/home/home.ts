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

@Component({
  selector: 'app-home',
  imports: [Nav, Hero, ScramblePhraseComponent, PillBtnComponent, TickerTapeComponent],
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

  readonly tickerRows: TickerRow[] = [
    {
      text: '// MAKING ENJOYABLE INTERFACES _________________ // THINKING IN USABILITY AND ACCESIBILITY',
      direction: 1,
    },
    { text: '// PLANING WAYS TO GUIDE THE USER', direction: -1 },
    {
      text: '// DESIGNING TO EMPHATIZE _________________ // enjoy doing unconventional designs conventionally',
      direction: 1,
    },
    { text: '// NECESITIES-CENTER MINDSET', direction: -1 },
    { text: '// Let me introduce myself', direction: 1 },
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
