import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import {
  ScramblePhraseComponent,
  ScrambleWordDef,
} from '../scramble-phrase/scramble-phrase';
import { PillBtnComponent } from '../pill-btn/pill-btn';
import { ScrollRevealService } from '../../services/scroll-reveal.service';

@Component({
  selector: 'app-contact',
  imports: [ScramblePhraseComponent, PillBtnComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactSection implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl') private sectionEl!: ElementRef<HTMLElement>;
  private cleanupReveal?: () => void;
  private visibilityObserver?: IntersectionObserver;

  constructor(private scrollReveal: ScrollRevealService) {}

  ngAfterViewInit(): void {
    this.cleanupReveal = this.scrollReveal.reveal(this.sectionEl.nativeElement);

    // Delay phrase start until the section enters the viewport
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.visibilityObserver?.disconnect();
        this.phraseVisible = true;
      },
      { threshold: 0.25 },
    );
    this.visibilityObserver.observe(this.sectionEl.nativeElement);
  }

  /**
   * Two phrases that alternate every 10 s.
   * Each phrase is an array of lines; each line is an array of word defs.
   */
  private readonly phraseGroups: ScrambleWordDef[][][] = [
    [
      [{ text: 'Want' }, { text: 'to', font: 'serif' }],
      [{ text: 'work' }],
      [{ text: 'together?' }],
    ],
    [
      [{ text: "Let's" }],
      [{ text: 'get' }, { text: 'in' }],
      [{ text: 'touch', font: 'serif' }],
    ],
  ];

  phraseIndex = 0;
  /** Controls @if — starts false, set to true when section enters viewport */
  phraseVisible = false;
  /** Triggers CSS fade-out before swap */
  phraseExiting = false;

  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;

  get currentLines(): ScrambleWordDef[][] {
    return this.phraseGroups[this.phraseIndex];
  }

  /** Called when the current phrase's scramble-in animation finishes */
  onPhraseComplete(): void {
    this.cycleTimer = setTimeout(() => this.startExit(), 10_000);
  }

  private startExit(): void {
    this.phraseExiting = true;
    this.exitTimer = setTimeout(() => {
      this.phraseVisible = false;
      this.phraseExiting = false;
      // One extra tick lets Angular destroy the old component before recreating
      setTimeout(() => {
        this.phraseIndex = (this.phraseIndex + 1) % this.phraseGroups.length;
        this.phraseVisible = true;
      }, 50);
    }, 500);
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
    this.visibilityObserver?.disconnect();
    if (this.cycleTimer !== null) clearTimeout(this.cycleTimer);
    if (this.exitTimer !== null) clearTimeout(this.exitTimer);
  }
}
