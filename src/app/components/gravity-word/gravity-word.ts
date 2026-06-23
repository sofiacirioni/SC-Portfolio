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
 * The name as large IBM Plex Serif bold text whose letters fall under gravity a
 * few seconds after the footer enters view, then react to the mouse. Light
 * (~13 bodies) so collisions stay on → the letters stack neatly. Isolated so it
 * never blocks the footer links (pointer-events:none, walled physics, reserved
 * height, prefers-reduced-motion static, runs only in view).
 */
@Component({
  selector: 'app-gravity-word',
  imports: [],
  template: `<span class="gw" #container role="img" [attr.aria-label]="text">@for (
      ch of chars;
      track $index
    ) {<span class="gw__l" #letter aria-hidden="true">{{ ch === ' ' ? ' ' : ch }}</span>}</span>`,
  styles: `
    :host {
      display: block;
    }
    .gw {
      position: relative;
      display: block;
      /* full-bleed: the play area spans the whole viewport width, word centered */
      width: 100vw;
      margin-left: -1rem;
      text-align: center;
      white-space: pre;
      pointer-events: none;
      opacity: 0.2;
      font-family: var(--font-serif);
      font-weight: 700;
      font-style: italic;
      font-size: clamp(2.5rem, 11vw, 9rem);
      line-height: 1;
      color: var(--color-accent);
      overflow: visible;
    }
    .gw__l {
      display: inline-block;
      transform-origin: center center;
      will-change: transform;
    }
  `,
})
export class GravityWord implements OnInit, AfterViewInit, OnDestroy {
  @Input() text = '';

  chars: string[] = [];

  @ViewChild('container') private containerRef!: ElementRef<HTMLElement>;
  @ViewChildren('letter') private letterEls!: QueryList<ElementRef<HTMLElement>>;

  private readonly FALL_FACTOR = 1.5; // band height: word on top + a small drop
  private readonly RELEASE_DELAY_MS = 3000;
  private readonly MOUSE_RADIUS = 150;
  private readonly MOUSE_STRENGTH = 0.02;

  private lineH = 0;
  private worldH = 0;

  private engine: Engine | null = null;
  private letters: Letter[] = [];
  private tickerFn: ((time: number, deltaTime: number) => void) | null = null;
  private observer?: IntersectionObserver;
  private resizeHandler?: () => void;
  private mouseHandler?: (e: MouseEvent) => void;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly mouse = { x: -9999, y: -9999, active: false };
  private started = false;
  private inView = false;

  constructor(
    private ngZone: NgZone,
    private hostEl: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    this.chars = Array.from(this.text);
  }

  ngAfterViewInit(): void {
    this.reserve();

    if (this.prefersReducedMotion()) return; // stay static

    this.resizeHandler = () => {
      if (!this.started) this.reserve();
    };
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        if (entry.isIntersecting && !this.started && this.startTimer === null) {
          this.startTimer = setTimeout(() => this.start(), this.RELEASE_DELAY_MS);
        }
      },
      { threshold: 0.2 },
    );
    // Observe the component host (normal box), not the full-bleed .gw.
    this.observer.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.startTimer !== null) clearTimeout(this.startTimer);
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
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

  /** Reserve the fall room up-front (word on top, empty below) — no layout shift. */
  private reserve(): void {
    const host = this.containerRef.nativeElement;
    host.style.height = '';
    const naturalH = host.getBoundingClientRect().height;
    if (naturalH === 0) return;
    this.lineH = naturalH;
    this.worldH = this.lineH * this.FALL_FACTOR;
    host.style.width = `${host.getBoundingClientRect().width}px`;
    host.style.height = `${this.worldH}px`;
  }

  private start(): void {
    if (this.started) return;
    this.started = true;

    const host = this.containerRef.nativeElement;
    const cRect = host.getBoundingClientRect();
    const W = cRect.width;

    // Measure each glyph (skip the space) before detaching from flow.
    const measured = this.letterEls
      .map((r) => r.nativeElement)
      .filter((el) => (el.textContent ?? '').trim().length > 0)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left - cRect.left, y: r.top - cRect.top, w: r.width, h: r.height };
      });

    this.ngZone.runOutsideAngular(() => {
      const engine = Engine.create();
      engine.gravity.y = 1;
      this.engine = engine;

      const t = 200;
      // Extend the ceiling up to the footer top (behind the links) so the
      // letters can travel up there; the floor stays where it is now.
      const ceil = -this.hostEl.nativeElement.offsetTop;
      const wallCy = (ceil + this.worldH) / 2;
      const wallH = this.worldH - ceil + t * 2;
      Composite.add(engine.world, [
        Bodies.rectangle(W / 2, this.worldH + t / 2, W + t * 2, t, { isStatic: true }), // floor (unchanged)
        Bodies.rectangle(W / 2, ceil - t / 2, W + t * 2, t, { isStatic: true }), // ceiling at footer top
        Bodies.rectangle(-t / 2, wallCy, t, wallH, { isStatic: true }), // left
        Bodies.rectangle(W + t / 2, wallCy, t, wallH, { isStatic: true }), // right
      ]);

      for (const m of measured) {
        const body = Bodies.rectangle(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.9, m.h * 0.7, {
          restitution: 0.3,
          friction: 0.5,
          frictionAir: 0.01,
        });
        Composite.add(engine.world, body);
        m.el.style.position = 'absolute';
        m.el.style.left = '0';
        m.el.style.top = '0';
        m.el.style.margin = '0';
        this.letters.push({ el: m.el, body, w: m.w, h: m.h });
      }

      this.mouseHandler = (e: MouseEvent) => {
        const rect = host.getBoundingClientRect();
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
