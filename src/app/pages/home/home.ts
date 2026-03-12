import { DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { Hero } from '../../components/hero/hero';
import {
  ScramblePhraseComponent,
  ScrambleWordDef,
} from '../../components/scramble-phrase/scramble-phrase';
import { PillBtnComponent } from '../../components/pill-btn/pill-btn';

@Component({
  selector: 'app-home',
  imports: [Nav, Hero, ScramblePhraseComponent, PillBtnComponent],
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
