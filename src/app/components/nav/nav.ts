import { Component } from '@angular/core';

const NAV_ITEMS = ['About', 'Skills', 'Projects', 'Contact'] as const;
type NavItem = (typeof NAV_ITEMS)[number];

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  items: NavItem[] = [...NAV_ITEMS];
}
