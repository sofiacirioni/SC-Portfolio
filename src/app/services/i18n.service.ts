import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'es';

const STORAGE_KEY = 'sc-lang';

/**
 * App-wide language state. Zoneless-friendly: `lang` is a signal, so any
 * template expression that reads it (directly or through a component's `copy`
 * computed) re-evaluates when the language toggles. English is the default.
 *
 * Components hold their own EN/ES copy and pick it via `i18n.lang()`; this
 * service only owns the current language + persistence.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readInitial());

  constructor() {
    // Reflect the initial (possibly persisted) language on the <html> element.
    try {
      document.documentElement.lang = this.lang();
    } catch {
      /* SSR / no document — non-fatal */
    }
  }

  private readInitial(): Lang {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  }

  toggle(): void {
    this.setLang(this.lang() === 'en' ? 'es' : 'en');
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — non-fatal */
    }
    try {
      document.documentElement.lang = lang;
    } catch {
      /* SSR / no document — non-fatal */
    }
  }
}
