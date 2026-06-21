import { Component, Input } from '@angular/core';

/**
 * Single shared line-style arrow (shaft + head, rounded caps).
 * Base direction is DOWN; rotate it per context via `angle` (degrees, CW):
 *   0 = down · -135 = up-right · -90 = right · 180 = up · 90 = left.
 * Inherits `color` via currentColor and scales with the parent font-size.
 */
@Component({
  selector: 'app-arrow-icon',
  imports: [],
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    [style.transform]="'rotate(' + angle + 'deg)'"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>`,
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class ArrowIcon {
  /** Rotation in degrees (clockwise). 0 = down. */
  @Input() angle = 0;
}
