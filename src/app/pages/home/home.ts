import { Component } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { Hero } from '../../components/hero/hero';

interface PhraseLetter {
  char: string;
  font: 'mono' | 'serif';
  delay: number;
}

interface PhraseLine {
  letters: PhraseLetter[];
}

const PHRASE_LINES_DEF: { text: string; font: 'mono' | 'serif' }[][] = [
  [{ text: 'Inspire', font: 'mono' }],
  [{ text: 'through', font: 'serif' }, { text: 'design', font: 'mono' }],
];

const BASE_DELAY_MS = 4000;
const STEP_MS = 55;

@Component({
  selector: 'app-home',
  imports: [Nav, Hero],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly phraseLines: PhraseLine[];

  constructor() {
    let charIndex = 0;

    this.phraseLines = PHRASE_LINES_DEF.map((lineDef) => {
      const letters: PhraseLetter[] = [];

      lineDef.forEach((word, wordIndex) => {
        if (wordIndex > 0) {
          letters.push({ char: ' ', font: 'mono', delay: BASE_DELAY_MS + charIndex * STEP_MS });
          charIndex++;
        }
        for (const char of word.text) {
          letters.push({ char, font: word.font, delay: BASE_DELAY_MS + charIndex * STEP_MS });
          charIndex++;
        }
      });

      return { letters };
    });
  }
}
