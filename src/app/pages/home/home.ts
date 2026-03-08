import { Component } from '@angular/core';
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
export class Home {
  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'Inspire' }],
    [{ text: 'through' }, { text: 'design' }],
  ];

  phraseReady = false;

  onPhraseComplete(): void {
    this.phraseReady = true;
  }
}
