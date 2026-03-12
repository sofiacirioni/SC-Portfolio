import { Component } from '@angular/core';

const NAV_ITEMS = ['About', 'Projects', 'Contact'] as const;
type NavItem = (typeof NAV_ITEMS)[number];

/** Grid column position for each nav item (1-based, desktop 6-col grid) */
const NAV_COLUMNS: Record<NavItem, number> = {
  About: 2,
  Projects: 4,
  Contact: 6,
};

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  items: NavItem[] = [...NAV_ITEMS];
  navColumns = NAV_COLUMNS;
}
