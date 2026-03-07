import { Component } from '@angular/core';
import { Home } from './pages/home/home';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Home],
  template: `
    <div class="min-h-screen">
      <app-home />
    </div>
  `,
})
export class AppComponent {}
