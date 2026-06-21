import { Component } from '@angular/core';

/**
 * Diagonal up-right arrow (↗), inherits `color` via currentColor and scales
 * with the parent font-size. Shared by pill-btn and footer/inline links.
 */
@Component({
  selector: 'app-arrow-icon',
  imports: [],
  template: `<svg viewBox="0 0 11 11" fill="none" aria-hidden="true">
    <path
      d="M1 10L10 1M10 1H3.5M10 1V7.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
  styles: `
    :host {
      display: inline-block;
      width: 0.62em;
      height: 0.62em;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class ArrowIcon {}
