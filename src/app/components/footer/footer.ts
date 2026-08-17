import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { ScrollRevealService } from '../../services/scroll-reveal.service';
import { ArrowIcon } from '../arrow-icon/arrow-icon';
import { GravityWord } from '../gravity-word/gravity-word';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-site-footer',
  imports: [ArrowIcon, GravityWord],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class SiteFooter implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl') private sectionEl!: ElementRef<HTMLElement>;
  private cleanupReveal?: () => void;
  readonly i18n = inject(I18nService);

  /**
   * Footer copy per language. The note is split into parts so the accent word
   * lives in the template (`<em>`) and gets the component's scoped styling —
   * an innerHTML-injected `<em>` misses Angular's encapsulation attribute and
   * would render without the accent colour.
   */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? {
          social: '[ Redes ]',
          note: { line1: '¿Tenés una idea todavía en el aire?', pre: 'Vamos a ', accent: 'concretarla', post: '.' },
          top: 'Volver arriba',
          rights: 'Todos los derechos reservados',
          made: 'Hecho en Argentina',
        }
      : {
          social: '[ Social ]',
          note: { line1: 'Still have an idea up in the air?', pre: "Let's ", accent: 'land it', post: '.' },
          top: 'Back to top',
          rights: 'All rights reserved',
          made: 'Made in Argentina',
        },
  );

  constructor(private scrollReveal: ScrollRevealService) {}

  ngAfterViewInit(): void {
    this.cleanupReveal = this.scrollReveal.reveal(this.sectionEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
  }
}
