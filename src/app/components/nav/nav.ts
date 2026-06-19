import { Component } from '@angular/core';

const NAV_ITEMS = ['About', 'Projects', 'Contact'] as const;
type NavItem = (typeof NAV_ITEMS)[number];

/**
 * Grid column position for each nav item in the 12-col global grid.
 * Each old 6-col position maps to: old_col × 2 → right edge of that pair.
 * About: old col 2 → col 4 | Projects: old col 4 → col 8 | Contact: old col 6 → col 12
 */
const NAV_COLUMNS: Record<NavItem, number> = {
  About: 4,
  Projects: 8,
  Contact: 12,
};

/** In-page anchor target for each nav item (matches section ids on the home page) */
const NAV_HREFS: Record<NavItem, string> = {
  About: '#about',
  Projects: '#projects',
  Contact: '#contact',
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
  navHrefs = NAV_HREFS;
}
