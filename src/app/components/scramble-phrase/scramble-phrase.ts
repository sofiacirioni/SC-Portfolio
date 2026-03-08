import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import gsap from 'gsap';

export interface ScrambleWordDef {
  text: string;
  /** Default: 'mono' */
  font?: 'mono' | 'serif';
}

interface PhraseToken {
  char: string;
  font: 'mono' | 'serif';
  isSpace: boolean;
}

interface PhraseLine {
  tokens: PhraseToken[];
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&?@0123456789';

const FONT_VARS: Record<'mono' | 'serif', string> = {
  mono: 'var(--font-mono)',
  serif: 'var(--font-serif)',
};

const STAGGER_S = 0.06;
const SCRAMBLE_DURATION_S = 0.5;
const SCRAMBLE_FRAME_MS = 80;

@Component({
  selector: 'app-scramble-phrase',
  imports: [],
  templateUrl: './scramble-phrase.html',
  styleUrl: './scramble-phrase.css',
})
export class ScramblePhraseComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Each inner array is a line; each object is a word with optional font */
  @Input() lines: ScrambleWordDef[][] = [];
  /** Seconds before the first letter starts appearing */
  @Input() baseDelayS = 0;
  /** CSS font-size value for the phrase (must be a multiple of 18 in rem) */
  @Input() fontSize = '6rem';
  /** Min ms to wait between idle scramble triggers */
  @Input() idleMinMs = 6000;
  /** Max ms to wait between idle scramble triggers */
  @Input() idleMaxMs = 11000;

  phraseLines: PhraseLine[] = [];

  @ViewChild('phraseContainer') private containerRef!: ElementRef<HTMLElement>;

  private revealedSpans = new Set<HTMLElement>();
  private currentFontKey = new Map<HTMLElement, 'mono' | 'serif'>();
  private delayedCalls: gsap.core.Tween[] = [];
  private activeScrambles = new Map<HTMLElement, gsap.core.Tween>();
  private hoverListeners: { el: HTMLElement; fn: EventListener }[] = [];
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private isVisible = false;
  private intersectionObserver!: IntersectionObserver;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.phraseLines = this.lines.map((lineDef) => {
      const tokens: PhraseToken[] = [];
      lineDef.forEach((word, wi) => {
        if (wi > 0) tokens.push({ char: '', font: 'mono', isSpace: true });
        for (const char of word.text) {
          tokens.push({ char, font: word.font ?? 'mono', isSpace: false });
        }
      });
      return { tokens };
    });
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const container = this.containerRef.nativeElement;
      const spans = Array.from(container.querySelectorAll<HTMLElement>('.phrase-letter'));

      // Lock each span's width to prevent layout shift during scramble
      spans.forEach((span) => {
        span.style.minWidth = `${span.offsetWidth}px`;
        span.style.textAlign = 'center';
      });

      // Initial load: staggered scramble reveal left → right
      spans.forEach((span, i) => {
        const originalChar = span.dataset['char']!;
        const originalFontKey = (span.dataset['font'] as 'mono' | 'serif') ?? 'mono';
        this.currentFontKey.set(span, originalFontKey);

        const dc = gsap.delayedCall(this.baseDelayS + i * STAGGER_S, () => {
          gsap.set(span, { opacity: 1 });
          this.revealedSpans.add(span);
          this.runScramble(span, originalChar, FONT_VARS[originalFontKey], SCRAMBLE_DURATION_S);

          if (i === spans.length - 1) {
            setTimeout(() => this.scheduleIdleScramble(), (SCRAMBLE_DURATION_S + 1.5) * 1000);
          }
        });
        this.delayedCalls.push(dc);
      });

      // Hover: scramble → toggle font (mono ↔ serif), reset idle timer
      spans.forEach((span) => {
        const originalChar = span.dataset['char']!;
        const fn: EventListener = () => {
          if (!this.revealedSpans.has(span)) return;
          const current = this.currentFontKey.get(span) ?? 'mono';
          const nextKey: 'mono' | 'serif' = current === 'mono' ? 'serif' : 'mono';
          this.currentFontKey.set(span, nextKey);
          this.runScramble(span, originalChar, FONT_VARS[nextKey], 0.5);
          this.scheduleIdleScramble();
        };
        span.addEventListener('mouseenter', fn);
        this.hoverListeners.push({ el: span, fn });
      });

      // Pause idle scramble when section leaves the viewport
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          this.isVisible = entries[0].isIntersecting;
          if (!this.isVisible && this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
          }
        },
        { threshold: 0.3 },
      );
      this.intersectionObserver.observe(container);
    });
  }

  ngOnDestroy(): void {
    this.delayedCalls.forEach((dc) => dc.kill());
    this.activeScrambles.forEach((t) => t.kill());
    this.hoverListeners.forEach(({ el, fn }) => el.removeEventListener('mouseenter', fn));
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    this.intersectionObserver?.disconnect();
  }

  private scheduleIdleScramble(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.idleTimer !== null) clearTimeout(this.idleTimer);

      const delay = this.idleMinMs + Math.random() * (this.idleMaxMs - this.idleMinMs);

      this.idleTimer = setTimeout(() => {
        if (!this.isVisible || this.revealedSpans.size === 0) return;

        const available = Array.from(this.revealedSpans).filter(
          (s) => !this.activeScrambles.has(s),
        );
        if (available.length === 0) {
          this.scheduleIdleScramble();
          return;
        }

        const span = available[Math.floor(Math.random() * available.length)];
        const originalChar = span.dataset['char']!;
        const current = this.currentFontKey.get(span) ?? 'mono';
        const nextKey: 'mono' | 'serif' = current === 'mono' ? 'serif' : 'mono';
        this.currentFontKey.set(span, nextKey);

        this.runScramble(span, originalChar, FONT_VARS[nextKey], 0.5);
        this.scheduleIdleScramble();
      }, delay);
    });
  }

  private runScramble(
    element: HTMLElement,
    finalChar: string,
    finalFont: string,
    duration: number,
  ): void {
    this.activeScrambles.get(element)?.kill();

    const obj = { t: 0 };
    const isSerif = finalFont === FONT_VARS.serif;
    let lastFrameMs = 0;

    const tween = gsap.to(obj, {
      t: 1,
      duration,
      ease: 'none',
      onUpdate: () => {
        const now = Date.now();
        if (now - lastFrameMs < SCRAMBLE_FRAME_MS) return;
        lastFrameMs = now;

        const useSerif = Math.random() > 0.5;
        element.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        element.style.fontFamily = useSerif ? FONT_VARS.serif : FONT_VARS.mono;
        element.style.fontStyle = useSerif ? 'italic' : 'normal';
        element.style.color = 'var(--color-accent)';
      },
      onComplete: () => {
        element.textContent = finalChar;
        element.style.fontFamily = finalFont;
        element.style.fontStyle = isSerif ? 'italic' : 'normal';
        element.style.color = '';
        this.activeScrambles.delete(element);
      },
    });

    this.activeScrambles.set(element, tween);
  }
}
