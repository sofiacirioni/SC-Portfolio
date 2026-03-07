import { Component } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { Hero } from '../../components/hero/hero';

@Component({
  selector: 'app-home',
  imports: [Nav, Hero],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
