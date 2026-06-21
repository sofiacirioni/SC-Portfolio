import { Component, Input } from '@angular/core';
import { ArrowIcon } from '../arrow-icon/arrow-icon';

@Component({
  selector: 'app-pill-btn',
  imports: [ArrowIcon],
  templateUrl: './pill-btn.html',
  styleUrl: './pill-btn.css',
})
export class PillBtnComponent {
  @Input() label = 'See projects';
  @Input() href = '#';
}
