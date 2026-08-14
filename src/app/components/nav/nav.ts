import { Component, inject } from '@angular/core';
import { I18nService, Lang } from '../../services/i18n.service';

const NAV_ITEMS = ['About', 'Projects', 'Contact'] as const;
type NavItem = (typeof NAV_ITEMS)[number];

/**
 * Grid column position for each nav item in the 12-col global grid.
 * Re-spread to 4 / 7 / 10 so the far-right column (12) is free for the
 * language toggle, keeping an even spacing across the bar.
 */
const NAV_COLUMNS: Record<NavItem, number> = {
  About: 4,
  Projects: 7,
  Contact: 10,
};

/** In-page anchor target for each nav item (matches section ids on the home page) */
const NAV_HREFS: Record<NavItem, string> = {
  About: '#about',
  Projects: '#projects',
  Contact: '#contact',
};

/** Display labels per language (keys stay English for hrefs/columns). */
const NAV_LABELS: Record<Lang, Record<NavItem, string>> = {
  en: { About: 'About', Projects: 'Projects', Contact: 'Contact' },
  es: { About: 'Sobre mí', Projects: 'Proyectos', Contact: 'Contacto' },
};

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  readonly i18n = inject(I18nService);
  items: NavItem[] = [...NAV_ITEMS];
  navColumns = NAV_COLUMNS;
  navHrefs = NAV_HREFS;

  /** Reactive: reads the lang signal so the template updates on toggle. */
  label(item: NavItem): string {
    return NAV_LABELS[this.i18n.lang()][item];
  }
}
