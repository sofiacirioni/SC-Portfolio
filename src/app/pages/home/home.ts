import { Component } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { Hero } from '../../components/hero/hero';
import {
  ScramblePhraseComponent,
  ScrambleWordDef,
} from '../../components/scramble-phrase/scramble-phrase';

@Component({
  selector: 'app-home',
  imports: [Nav, Hero, ScramblePhraseComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly phraseLines: ScrambleWordDef[][] = [
    [{ text: 'Inspire' }],
    [{ text: 'through' }, { text: 'design' }],
  ];
}
