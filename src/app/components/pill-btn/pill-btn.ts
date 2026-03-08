import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pill-btn',
  imports: [],
  templateUrl: './pill-btn.html',
  styleUrl: './pill-btn.css',
})
export class PillBtnComponent {
  @Input() label = 'See projects';
  @Input() href = '#';
}
