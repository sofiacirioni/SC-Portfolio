import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import {
  ScramblePhraseComponent,
  ScrambleWordDef,
} from '../scramble-phrase/scramble-phrase';
import { PillBtnComponent } from '../pill-btn/pill-btn';
import { AsciiVideo } from '../ascii-video/ascii-video';
import { ScrollRevealService } from '../../services/scroll-reveal.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-contact',
  imports: [ScramblePhraseComponent, PillBtnComponent, AsciiVideo],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactSection implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl') private sectionEl!: ElementRef<HTMLElement>;
  private cleanupReveal?: () => void;
  private visibilityObserver?: IntersectionObserver;
  readonly i18n = inject(I18nService);

  /** Section label + CTA per language. */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? { label: '[ Contacto ]', cta: 'Enviar un email' }
      : { label: '[ Contact ]', cta: 'Send an email' },
  );

  constructor(private scrollReveal: ScrollRevealService) {}

  ngAfterViewInit(): void {
    this.cleanupReveal = this.scrollReveal.reveal(this.sectionEl.nativeElement);

    // Start the phrase scramble only once the section is comfortably in view
    // (rootMargin trims the bottom 35% so it fires when the section has scrolled
    // well onto the screen — not the instant its top edge peeks in). The signal
    // write schedules change detection on its own (the app is zoneless).
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.visibilityObserver?.disconnect();
        this.phraseVisible.set(true);
      },
      { threshold: 0, rootMargin: '0px 0px -35% 0px' },
    );
    this.visibilityObserver.observe(this.sectionEl.nativeElement);
  }

  /**
   * Two phrases that alternate every 10 s.
   * Each phrase is an array of lines; each line is an array of word defs.
   */
  private readonly phraseGroups = computed<ScrambleWordDef[][][]>(() =>
    this.i18n.lang() === 'es'
      ? [
          [[{ text: '¿Creamos' }], [{ text: 'juntos?', font: 'serif' }]],
          [[{ text: 'Conversemos', font: 'serif' }]],
        ]
      : [
          [[{ text: 'Want' }, { text: 'to', font: 'serif' }], [{ text: 'work' }], [{ text: 'together?' }]],
          [[{ text: "Let's" }], [{ text: 'get' }, { text: 'in' }], [{ text: 'touch', font: 'serif' }]],
        ],
  );

  /** Index of the phrase currently shown (alternates). */
  readonly phraseIndex = signal(0);
  /** Controls @if — starts false, set to true when section enters viewport. */
  readonly phraseVisible = signal(false);
  /** Triggers the CSS fade-out before a swap. */
  readonly phraseExiting = signal(false);

  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;

  get currentLines(): ScrambleWordDef[][] {
    return this.phraseGroups()[this.phraseIndex()];
  }

  /** Called when the current phrase's scramble-in animation finishes */
  onPhraseComplete(): void {
    // A language toggle can recreate the phrase and fire this again — don't
    // stack cycle timers.
    if (this.cycleTimer !== null) clearTimeout(this.cycleTimer);
    this.cycleTimer = setTimeout(() => this.startExit(), 10_000);
  }

  private startExit(): void {
    this.phraseExiting.set(true);
    this.exitTimer = setTimeout(() => {
      this.phraseVisible.set(false);
      this.phraseExiting.set(false);
      // One extra tick lets Angular destroy the old component before recreating
      setTimeout(() => {
        this.phraseIndex.set((this.phraseIndex() + 1) % this.phraseGroups().length);
        this.phraseVisible.set(true);
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
