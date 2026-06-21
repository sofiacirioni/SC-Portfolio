import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import gsap from 'gsap';
import { Bodies, Body, Composite, Engine } from 'matter-js';

interface Letter {
  el: HTMLElement;
  body: Body;
  w: number;
  h: number;
}

/**
 * Oversized wordmark whose letters fall under gravity a few seconds after the
 * footer enters view, then react to the mouse. Implemented with Matter.js but
 * carefully isolated so it never blocks the footer links:
 *  - the letters layer is pointer-events:none (mouse is tracked via window,
 *    so links stay clickable);
 *  - physics is fully walled in (floor/ceiling/sides) within the wordmark band;
 *  - the band reserves its height so the layout never shifts;
 *  - prefers-reduced-motion keeps it static;
 *  - the simulation only runs while the footer is in view.
 */
@Component({
  selector: 'app-gravity-wordmark',
  imports: [],
  template: `<span class="gw" #container role="img" [attr.aria-label]="text">@for (
      ch of chars;
      track $index
    ) {<span class="gw__letter" #letter aria-hidden="true">{{ ch }}</span>}</span>`,
  styles: `
    :host {
      display: block;
    }
    .gw {
      position: relative;
      display: inline-block;
      white-space: pre;
      pointer-events: none;
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: clamp(2rem, 9.5vw, 9rem);
      line-height: 0.9;
      letter-spacing: -0.02em;
      color: var(--color-accent);
    }
    .gw__letter {
      display: inline-block;
      transform-origin: center center;
      will-change: transform;
    }
  `,
})
export class GravityWordmark implements OnInit, AfterViewInit, OnDestroy {
  @Input() text = '';
  chars: string[] = [];

  @ViewChild('container') private containerRef!: ElementRef<HTMLElement>;
  @ViewChildren('letter') private letterEls!: QueryList<ElementRef<HTMLElement>>;

  private readonly RELEASE_DELAY_MS = 2600;
  private readonly MOUSE_RADIUS = 130;
  private readonly MOUSE_STRENGTH = 0.012;

  private engine: Engine | null = null;
  private letters: Letter[] = [];
  private tickerFn: ((time: number, deltaTime: number) => void) | null = null;
  private observer?: IntersectionObserver;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private mouseHandler?: (e: MouseEvent) => void;
  private readonly mouse = { x: -9999, y: -9999, active: false };
  private started = false;
  private inView = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.chars = Array.from(this.text);
  }

  ngAfterViewInit(): void {
    if (this.prefersReducedMotion()) return; // stay static

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        if (entry.isIntersecting && !this.started && this.startTimer === null) {
          this.startTimer = setTimeout(() => this.start(), this.RELEASE_DELAY_MS);
        }
      },
      { threshold: 0.4 },
    );
    this.observer.observe(this.containerRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.startTimer !== null) clearTimeout(this.startTimer);
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    if (this.mouseHandler) window.removeEventListener('mousemove', this.mouseHandler);
    this.observer?.disconnect();
    if (this.engine) {
      Composite.clear(this.engine.world, false);
      Engine.clear(this.engine);
      this.engine = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private start(): void {
    if (this.started) return;
    this.started = true;

    const container = this.containerRef.nativeElement;
    const cRect = container.getBoundingClientRect();
    const W = cRect.width;
    const lineH = cRect.height;
    const worldH = lineH * 2.3; // text at top + room to fall

    // Measure each glyph (skip the space) before detaching from flow.
    const measured = this.letterEls
      .map((r) => r.nativeElement)
      .filter((el) => (el.textContent ?? '').trim().length > 0)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left - cRect.left, y: r.top - cRect.top, w: r.width, h: r.height };
      });

    // Lock the band's box so the layout never shifts once letters detach.
    container.style.width = `${W}px`;
    container.style.height = `${worldH}px`;

    this.ngZone.runOutsideAngular(() => {
      const engine = Engine.create();
      engine.gravity.y = 1;
      this.engine = engine;

      const t = 200;
      Composite.add(engine.world, [
        Bodies.rectangle(W / 2, worldH + t / 2, W + t * 2, t, { isStatic: true }), // floor
        Bodies.rectangle(W / 2, -t / 2, W + t * 2, t, { isStatic: true }), // ceiling
        Bodies.rectangle(-t / 2, worldH / 2, t, worldH + t * 2, { isStatic: true }), // left
        Bodies.rectangle(W + t / 2, worldH / 2, t, worldH + t * 2, { isStatic: true }), // right
      ]);

      for (const m of measured) {
        const body = Bodies.rectangle(m.x + m.w / 2, m.y + m.h / 2, m.w, m.h, {
          restitution: 0.32,
          friction: 0.4,
          frictionAir: 0.02,
        });
        Composite.add(engine.world, body);
        m.el.style.position = 'absolute';
        m.el.style.left = '0';
        m.el.style.top = '0';
        m.el.style.margin = '0';
        this.letters.push({ el: m.el, body, w: m.w, h: m.h });
      }

      this.mouseHandler = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.active = true;
      };
      window.addEventListener('mousemove', this.mouseHandler, { passive: true });

      this.tickerFn = (_time: number, deltaTime: number) => {
        if (!this.inView || !this.engine) return;

        if (this.mouse.active) {
          for (const L of this.letters) {
            const dx = L.body.position.x - this.mouse.x;
            const dy = L.body.position.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < this.MOUSE_RADIUS && dist > 0.01) {
              const f = (1 - dist / this.MOUSE_RADIUS) * this.MOUSE_STRENGTH * L.body.mass;
              Body.applyForce(L.body, L.body.position, { x: (dx / dist) * f, y: (dy / dist) * f });
            }
          }
        }

        Engine.update(this.engine, Math.min(33, Math.max(8, deltaTime)));

        for (const L of this.letters) {
          const p = L.body.position;
          L.el.style.transform =
            `translate(${p.x - L.w / 2}px, ${p.y - L.h / 2}px) rotate(${L.body.angle}rad)`;
        }
      };
      gsap.ticker.add(this.tickerFn);
    });
  }
}
