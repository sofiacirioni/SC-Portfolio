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

/**
 * ASCII rendering of the name (pre-generated from sofia-mark.png at 95×10).
 * Trailing spaces are trimmed per line; only non-space cells are rendered.
 */
const GRID = {
  cols: 95,
  rows: 10,
  lines: [
    '                        :  =-                         -             -                        -.',
    '                    -#  =  .                          =            :=                        =.',
    '                   .@*',
    '  ++ .*   *:  #:   #@   .%%    #=  :#       .#  *=  *@.  .%*  #*  #@    +:  #-   %#  :@*   +@-',
    '  @#     @*   %%   @+    @=   @+   @*      :@:  :   %%    @*      @*   @*   %%   @#   @=   *@',
    '   #%.  *@   .@+  =@    +@   *@   +@       %%      .@-   *@      -@   +@    @+  =@.  *@    @+',
    '    @#  *%   #*   %*    @*   %%   %#       @#      *@    @+      %#   *%   ##   @*   @=   =@',
    '=*  -    =  :.   :@     #+   -#-  +*       :*-.    +*.  .*       *+    =  :.    *    #=   =#:',
    '                 %*',
    '              %::=',
  ],
};

interface Cell {
  ch: string;
  col: number;
  row: number;
}

interface Live {
  el: HTMLElement;
  body: Body;
}

/**
 * The name rendered as ASCII characters that fall under gravity a few seconds
 * after the footer enters view, then react to the mouse. Isolated so it never
 * blocks the footer links (pointer-events:none, walled physics, reserved
 * height, prefers-reduced-motion static, runs only in view). Inter-character
 * collisions are off so ~160 bodies stay smooth — they overlap as they pile.
 */
@Component({
  selector: 'app-gravity-ascii',
  imports: [],
  template: `<div class="ga" #container role="img" [attr.aria-label]="alt">@for (
      cell of cells;
      track $index
    ) {<span class="ga__c" #cell aria-hidden="true">{{ cell.ch }}</span>}</div>`,
  styles: `
    :host {
      display: block;
    }
    .ga {
      position: relative;
      display: block;
      width: 100%;
      pointer-events: none;
      font-family: var(--font-mono);
      font-weight: 500;
      color: var(--color-accent);
    }
    .ga__c {
      position: absolute;
      left: 0;
      top: 0;
      text-align: center;
      transform-origin: center center;
      will-change: transform;
    }
  `,
})
export class GravityAscii implements OnInit, AfterViewInit, OnDestroy {
  @Input() alt = '';

  cells: Cell[] = [];

  @ViewChild('container') private containerRef!: ElementRef<HTMLElement>;
  @ViewChildren('cell') private cellEls!: QueryList<ElementRef<HTMLElement>>;

  private readonly CHAR_ASPECT = 0.55; // cell width / height
  private readonly RELEASE_DELAY_MS = 3000;
  private readonly MOUSE_RADIUS = 120;
  private readonly MOUSE_STRENGTH = 0.014;

  private readonly FALL_FACTOR = 2.2; // band height multiplier: name on top + room to fall
  private cw = 0;
  private ch = 0;
  private bandH = 0;
  private worldH = 0;

  private engine: Engine | null = null;
  private live: Live[] = [];
  private tickerFn: ((time: number, deltaTime: number) => void) | null = null;
  private observer?: IntersectionObserver;
  private resizeHandler?: () => void;
  private mouseHandler?: (e: MouseEvent) => void;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly mouse = { x: -9999, y: -9999, active: false };
  private started = false;
  private inView = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    for (let r = 0; r < GRID.rows; r++) {
      const line = GRID.lines[r] ?? '';
      for (let c = 0; c < line.length; c++) {
        if (line[c] !== ' ') this.cells.push({ ch: line[c], col: c, row: r });
      }
    }
  }

  ngAfterViewInit(): void {
    this.layout();

    if (this.prefersReducedMotion()) return; // stay static

    this.resizeHandler = () => {
      if (!this.started) this.layout();
    };
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        if (entry.isIntersecting && !this.started && this.startTimer === null) {
          this.startTimer = setTimeout(() => this.start(), this.RELEASE_DELAY_MS);
        }
      },
      { threshold: 0.35 },
    );
    this.observer.observe(this.containerRef.nativeElement);
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

  /** Size and grid-position the static cells based on the available width. */
  private layout(): void {
    const host = this.containerRef.nativeElement;
    const W = host.clientWidth;
    if (W === 0) return;

    this.cw = W / GRID.cols;
    this.ch = this.cw / this.CHAR_ASPECT;
    this.bandH = GRID.rows * this.ch;
    // Reserve the fall zone up-front (name on top, empty room below) so the
    // layout never shifts and the letters can never reach the legal line.
    this.worldH = this.bandH * this.FALL_FACTOR;
    host.style.height = `${this.worldH}px`;

    const els = this.cellEls.toArray();
    els.forEach((ref, i) => {
      const el = ref.nativeElement;
      const cell = this.cells[i];
      el.style.width = `${this.cw}px`;
      el.style.height = `${this.ch}px`;
      el.style.fontSize = `${this.ch * 0.7}px`;
      el.style.lineHeight = `${this.ch}px`;
      el.style.transform = `translate(${cell.col * this.cw}px, ${cell.row * this.ch}px)`;
    });
  }

  private start(): void {
    if (this.started) return;
    this.started = true;

    this.layout(); // refresh cw/ch/bandH/worldH + cell grid positions at the current width
    const host = this.containerRef.nativeElement;
    const W = host.clientWidth;
    const worldH = this.worldH;

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

      const els = this.cellEls.toArray();
      els.forEach((ref, i) => {
        const cell = this.cells[i];
        const cx = cell.col * this.cw + this.cw / 2;
        const cy = cell.row * this.ch + this.ch / 2;
        const body = Bodies.rectangle(cx, cy, this.cw * 0.72, this.ch * 0.72, {
          // collisions ON → characters stack into a pile instead of overlapping
          restitution: 0.15,
          friction: 0.6,
          frictionAir: 0.012,
        });
        Composite.add(engine.world, body);
        this.live.push({ el: ref.nativeElement, body });
      });

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
          for (const L of this.live) {
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

        for (const L of this.live) {
          const p = L.body.position;
          L.el.style.transform =
            `translate(${p.x - this.cw / 2}px, ${p.y - this.ch / 2}px) rotate(${L.body.angle}rad)`;
        }
      };
      gsap.ticker.add(this.tickerFn);
    });
  }
}
