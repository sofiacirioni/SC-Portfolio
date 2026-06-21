import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements AfterViewInit, OnDestroy {
  isPaused = false;

  // ── ASCII conversion (shared by intro + clouds) ────────────────
  /** ASCII grid width in characters. Higher = more detail, smaller scale. */
  private readonly ASCII_COLS = 280;
  /** ASCII grid height in characters. Tuned for a wide cinematic band. */
  private readonly ASCII_ROWS = 36;
  /** Monospace char width / height ratio — used to center-crop without distortion. */
  private readonly CHAR_ASPECT = 0.5;
  /** Luminance → glyph ramp, sparse (dark) → dense (bright). */
  private readonly RAMP = ' .:-=+*#%@';

  private readonly HELLO_FPS = 24;
  private readonly CLOUD_FPS = 14;
  /** Flip if the clouds/letters end up as the empty areas instead of the dense ones. */
  private readonly cloudInvert = true;
  private readonly helloInvert = true;

  private cloudCanvas: HTMLCanvasElement | null = null;
  private cloudCtx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastDraw = 0;

  // Smoothed luminance bounds for per-frame contrast normalization (avoids flicker).
  private loSmoothed = 0;
  private hiSmoothed = 1;
  private boundsInit = false;

  private phase: 'hello' | 'clouds' = 'hello';
  private activeVideo: HTMLVideoElement | null = null;
  private onHelloEnded = (): void => this.startClouds();

  private scaleReady = false;
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild('heroSection') private sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('animPre') private preRef!: ElementRef<HTMLPreElement>;
  @ViewChild('helloVideo') private helloRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('cloudVideo') private cloudRef!: ElementRef<HTMLVideoElement>;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.sectionRef.nativeElement);

    this.cloudCanvas = document.createElement('canvas');
    this.cloudCanvas.width = this.ASCII_COLS;
    this.cloudCanvas.height = this.ASCII_ROWS;
    this.cloudCtx = this.cloudCanvas.getContext('2d', { willReadFrequently: true });

    this.startHello();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.helloRef?.nativeElement.removeEventListener('ended', this.onHelloEnded);
    this.helloRef?.nativeElement.pause();
    this.cloudRef?.nativeElement.pause();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    const video = this.activeVideo;
    if (!video) return;
    if (this.isPaused) video.pause();
    else void video.play().catch(() => {});
  }

  // ── Intro "hello" (plays once) ─────────────────────────────────

  private startHello(): void {
    this.phase = 'hello';
    const video = this.helloRef.nativeElement;
    video.muted = true;
    video.addEventListener('ended', this.onHelloEnded, { once: true });
    this.activeVideo = video;
    void video.play().catch(() => {});

    this.ngZone.runOutsideAngular(() => {
      this.lastDraw = 0;
      this.renderLoop();
    });
  }

  // ── Clouds loop (takes over after the intro) ───────────────────

  private startClouds(): void {
    this.phase = 'clouds';
    this.boundsInit = false; // renormalize contrast for the new source
    const video = this.cloudRef.nativeElement;
    video.muted = true;
    this.activeVideo = video;
    void video.play().catch(() => {});
  }

  // ── Shared render loop ─────────────────────────────────────────

  private renderLoop = (): void => {
    this.rafId = requestAnimationFrame(this.renderLoop);
    if (this.isPaused) return;

    const fps = this.phase === 'hello' ? this.HELLO_FPS : this.CLOUD_FPS;
    const now = performance.now();
    if (now - this.lastDraw < 1000 / fps) return;
    this.lastDraw = now;

    this.drawFrame();
  };

  private drawFrame(): void {
    const video = this.activeVideo;
    const ctx = this.cloudCtx;
    if (!video || !ctx || video.readyState < 2 || !video.videoWidth) return;

    // Center-crop the source to the band's aspect so it isn't squished.
    const targetAspect = (this.ASCII_COLS * this.CHAR_ASPECT) / this.ASCII_ROWS;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    let sw = vw;
    let sh = vw / targetAspect;
    if (sh > vh) {
      sh = vh;
      sw = vh * targetAspect;
    }
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, this.ASCII_COLS, this.ASCII_ROWS);
    const { data } = ctx.getImageData(0, 0, this.ASCII_COLS, this.ASCII_ROWS);

    // Pass 1: per-frame luminance bounds, smoothed across frames so the
    // contrast stretch doesn't flicker.
    let lo = 1;
    let hi = 0;
    for (let p = 0; p < data.length; p += 4) {
      const lum = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
      if (lum < lo) lo = lum;
      if (lum > hi) hi = lum;
    }
    if (!this.boundsInit) {
      this.loSmoothed = lo;
      this.hiSmoothed = hi;
      this.boundsInit = true;
    } else {
      this.loSmoothed = this.loSmoothed * 0.85 + lo * 0.15;
      this.hiSmoothed = this.hiSmoothed * 0.85 + hi * 0.15;
    }
    const range = Math.max(0.001, this.hiSmoothed - this.loSmoothed);

    // Pass 2: normalize each cell into the full ramp so structure reads.
    const invert = this.phase === 'hello' ? this.helloInvert : this.cloudInvert;
    const rampMax = this.RAMP.length - 1;
    let out = '';
    for (let y = 0; y < this.ASCII_ROWS; y++) {
      for (let x = 0; x < this.ASCII_COLS; x++) {
        const i = (y * this.ASCII_COLS + x) * 4;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        let n = (lum - this.loSmoothed) / range;
        n = n < 0 ? 0 : n > 1 ? 1 : n;
        const v = invert ? 1 - n : n;
        out += this.RAMP[Math.round(v * rampMax)];
      }
      out += '\n';
    }

    this.renderText(out);
  }

  // ── Shared rendering / scaling ─────────────────────────────────

  /** Writes ASCII text straight to the <pre> (no Angular change detection). */
  private renderText(text: string): void {
    this.preRef.nativeElement.textContent = text;
    if (!this.scaleReady) {
      this.scaleReady = true;
      requestAnimationFrame(() => this.updateScale());
    }
  }

  private updateScale(): void {
    const section = this.sectionRef?.nativeElement;
    const pre = this.preRef?.nativeElement;
    if (!section || !pre) return;

    const sectionWidth = section.clientWidth;
    const preNaturalWidth = pre.scrollWidth;
    if (preNaturalWidth === 0 || sectionWidth === 0) return;

    const scale = sectionWidth / preNaturalWidth;
    pre.style.transform = `translateX(-50%) scale(${scale})`;
    section.style.height = `${pre.scrollHeight * scale}px`;
  }
}
