import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

/**
 * Renders a looping video as live ASCII art (same engine as the hero: sample
 * each frame onto a tiny canvas, map luminance to a glyph ramp, write to a
 * <pre> scaled to fill the host). Colour comes from CSS (`color` / currentColor).
 * The render loop only runs while the component is on screen.
 */
@Component({
  selector: 'app-ascii-video',
  standalone: true,
  template: `
    <div class="ascii-video" #host>
      <pre #pre></pre>
      <video
        #video
        class="ascii-video__source"
        [src]="src"
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>
    </div>
  `,
  styleUrl: './ascii-video.css',
})
export class AsciiVideo implements AfterViewInit, OnDestroy {
  /** Video source path. */
  @Input() src = '';
  /** ASCII grid width in characters (more = finer, smaller glyphs). */
  @Input() cols = 160;
  /** ASCII grid height in characters. cols/rows sets the display aspect. */
  @Input() rows = 58;
  /** Frames per second for the ASCII redraw. */
  @Input() fps = 14;
  /** Flip if the subject reads as the empty areas instead of the dense ones. */
  @Input() invert = true;

  /** Monospace glyph width/height ratio — used to center-crop without distortion. */
  private readonly CHAR_ASPECT = 0.5;
  /** Luminance → glyph ramp, sparse (dark) → dense (bright). */
  private readonly RAMP = ' .:-=+*#%@';

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastDraw = 0;

  private loSmoothed = 0;
  private hiSmoothed = 1;
  private boundsInit = false;

  private scaleReady = false;
  private resizeObserver: ResizeObserver | null = null;
  private visibilityObserver: IntersectionObserver | null = null;

  @ViewChild('host') private hostRef!: ElementRef<HTMLElement>;
  @ViewChild('pre') private preRef!: ElementRef<HTMLPreElement>;
  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.hostRef.nativeElement);

    this.ngZone.runOutsideAngular(() => {
      this.videoRef.nativeElement.muted = true;
      // Only decode + render while on screen.
      this.visibilityObserver = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? this.start() : this.stop()),
        { threshold: 0.05 },
      );
      this.visibilityObserver.observe(this.hostRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
  }

  private start(): void {
    void this.videoRef.nativeElement.play().catch(() => {});
    if (this.rafId === null) {
      this.lastDraw = 0;
      this.renderLoop();
    }
  }

  private stop(): void {
    this.videoRef.nativeElement.pause();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private renderLoop = (): void => {
    this.rafId = requestAnimationFrame(this.renderLoop);
    const now = performance.now();
    if (now - this.lastDraw < 1000 / this.fps) return;
    this.lastDraw = now;
    this.drawFrame();
  };

  private drawFrame(): void {
    const video = this.videoRef.nativeElement;
    const ctx = this.ctx;
    if (!video || !ctx || video.readyState < 2 || !video.videoWidth) return;

    // Center-crop the source to the grid's aspect so it isn't squished.
    const targetAspect = (this.cols * this.CHAR_ASPECT) / this.rows;
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

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, this.cols, this.rows);
    const { data } = ctx.getImageData(0, 0, this.cols, this.rows);

    // Smoothed per-frame luminance bounds so the contrast stretch doesn't flicker.
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

    const rampMax = this.RAMP.length - 1;
    let out = '';
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = (y * this.cols + x) * 4;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        let n = (lum - this.loSmoothed) / range;
        n = n < 0 ? 0 : n > 1 ? 1 : n;
        const v = this.invert ? 1 - n : n;
        out += this.RAMP[Math.round(v * rampMax)];
      }
      out += '\n';
    }

    this.renderText(out);
  }

  private renderText(text: string): void {
    this.preRef.nativeElement.textContent = text;
    // Retry each frame until the <pre> has been laid out and the scale sticks.
    if (!this.scaleReady) this.updateScale();
  }

  private updateScale(): void {
    const host = this.hostRef?.nativeElement;
    const pre = this.preRef?.nativeElement;
    if (!host || !pre) return;

    const hostWidth = host.clientWidth;
    const preNaturalWidth = pre.scrollWidth;
    if (preNaturalWidth === 0 || hostWidth === 0) return;

    const scale = hostWidth / preNaturalWidth;
    pre.style.transform = `translateX(-50%) scale(${scale})`;
    host.style.height = `${pre.scrollHeight * scale}px`;
    this.scaleReady = true;
  }
}
