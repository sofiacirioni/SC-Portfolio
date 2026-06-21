import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ScrollRevealService } from '../../services/scroll-reveal.service';
import { ArrowIcon } from '../arrow-icon/arrow-icon';
import { GravityWordmark } from '../gravity-wordmark/gravity-wordmark';

@Component({
  selector: 'app-site-footer',
  imports: [ArrowIcon, GravityWordmark],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class SiteFooter implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl') private sectionEl!: ElementRef<HTMLElement>;
  private cleanupReveal?: () => void;

  constructor(private scrollReveal: ScrollRevealService) {}

  ngAfterViewInit(): void {
    this.cleanupReveal = this.scrollReveal.reveal(this.sectionEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
  }
}
