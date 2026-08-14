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

  /** Footer copy per language (`note` carries an <em> accent → innerHTML). */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? {
          social: '[ Redes ]',
          note: '¿Tenés una idea todavía <em>en el aire</em>?<br>Vamos a concretarla.',
          top: 'Volver arriba',
          rights: 'Todos los derechos reservados',
          made: 'Hecho en Argentina',
        }
      : {
          social: '[ Social ]',
          note: "Still have an idea <em>up in the air</em>?<br>Let's land it.",
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
