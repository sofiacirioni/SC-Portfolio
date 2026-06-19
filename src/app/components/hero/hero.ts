import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit, AfterViewInit, OnDestroy {
  isPaused = false;

  // ── Welcome intro (kept as pre-rendered ASCII frames) ──────────
  private readonly WELCOME_TOTAL = 85;
  private readonly WELCOME_FPS = 30;
  private welcomeFrames: (string | null)[] = new Array(85).fill(null);
  private welcomeIndex = 0;
  private welcomeTimer: ReturnType<typeof setInterval> | null = null;

  // ── Clouds (live ASCII from the source video) ──────────────────
  /** ASCII grid width in characters. Higher = more detail, smaller scale. */
  private readonly ASCII_COLS = 280;
  /** ASCII grid height in characters. Tuned for a wide cinematic band. */
  private readonly ASCII_ROWS = 36;
  /** Frames per second for the cloud ASCII update (clouds move slowly). */
  private readonly CLOUD_FPS = 14;
  /** Monospace char width / height ratio — used to center-crop without distortion. */
  private readonly CHAR_ASPECT = 0.5;
  /**
   * Luminance → glyph ramp, sparse (dark) → dense (bright).
   * Flip `cloudInvert` if clouds end up as the empty areas instead of the dense ones.
   */
  private readonly RAMP = ' .:-=+*#%@';
  private cloudInvert = false;

  private cloudCanvas: HTMLCanvasElement | null = null;
  private cloudCtx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastCloudDraw = 0;

  // Smoothed luminance bounds for per-frame contrast normalization (avoids flicker).
  private loSmoothed = 0;
  private hiSmoothed = 1;
  private boundsInit = false;

  // ── Shared layout ──────────────────────────────────────────────
  private phase: 'welcome' | 'clouds' = 'welcome';
  private scaleReady = false;
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild('heroSection') private sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('animPre') private preRef!: ElementRef<HTMLPreElement>;
  @ViewChild('cloudVideo') private videoRef!: ElementRef<HTMLVideoElement>;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    void this.loadWelcome();
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.sectionRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.welcomeTimer !== null) clearInterval(this.welcomeTimer);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.videoRef?.nativeElement.pause();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    if (this.isPaused) video.pause();
    else if (this.phase === 'clouds') void video.play().catch(() => {});
  }

  // ── Welcome intro ──────────────────────────────────────────────

  private async loadWelcome(): Promise<void> {
    const fetches = this.welcomeFrames.map((_, i) => {
      const frameNum = String(i + 1).padStart(4, '0');
      return fetch(`assets/ascii-frames/welcome-ascii-animation/frame_${frameNum}.txt`)
        .then((r) => (r.ok ? r.text() : ''))
        .then((text) => {
          this.welcomeFrames[i] = text;
        })
        .catch(() => {
          this.welcomeFrames[i] = '';
        });
    });

    // Start as soon as the first frame is ready; keep loading the rest in parallel.
    await fetches[0];
    this.startWelcome();
  }

  private startWelcome(): void {
    this.ngZone.runOutsideAngular(() => {
      this.welcomeTimer = setInterval(() => {
        if (this.isPaused) return;

        const frame = this.welcomeFrames[this.welcomeIndex];
        if (frame) this.renderText(frame);
        this.welcomeIndex++;

        if (this.welcomeIndex >= this.WELCOME_TOTAL) {
          if (this.welcomeTimer !== null) clearInterval(this.welcomeTimer);
          this.welcomeTimer = null;
          this.startClouds();
        }
      }, Math.round(1000 / this.WELCOME_FPS));
    });
  }

  // ── Clouds (video → ASCII) ─────────────────────────────────────

  private startClouds(): void {
    this.phase = 'clouds';

    this.cloudCanvas = document.createElement('canvas');
    this.cloudCanvas.width = this.ASCII_COLS;
    this.cloudCanvas.height = this.ASCII_ROWS;
    this.cloudCtx = this.cloudCanvas.getContext('2d', { willReadFrequently: true });

    const video = this.videoRef.nativeElement;
    // Set muted as a property (Angular doesn't reliably bind the `muted` attribute),
    // otherwise autoplay is blocked.
    video.muted = true;
    void video.play().catch(() => {});

    this.ngZone.runOutsideAngular(() => {
      this.lastCloudDraw = 0;
      this.cloudLoop();
    });
  }

  private cloudLoop = (): void => {
    this.rafId = requestAnimationFrame(this.cloudLoop);
    if (this.isPaused) return;

    const now = performance.now();
    if (now - this.lastCloudDraw < 1000 / this.CLOUD_FPS) return;
    this.lastCloudDraw = now;

    this.drawCloudFrame();
  };

  private drawCloudFrame(): void {
    const video = this.videoRef.nativeElement;
    const ctx = this.cloudCtx;
    if (!ctx || video.readyState < 2 || !video.videoWidth) return;

    // Center-crop the video to the band's aspect so clouds aren't squished.
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

    // Pass 1: find this frame's luminance bounds, then smooth them across frames
    // so the contrast stretch doesn't flicker as clouds drift.
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

    // Pass 2: normalize each cell into the full ramp so cloud structure reads.
    const rampMax = this.RAMP.length - 1;
    let out = '';
    for (let y = 0; y < this.ASCII_ROWS; y++) {
      for (let x = 0; x < this.ASCII_COLS; x++) {
        const i = (y * this.ASCII_COLS + x) * 4;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        let n = (lum - this.loSmoothed) / range;
        n = n < 0 ? 0 : n > 1 ? 1 : n;
        const v = this.cloudInvert ? 1 - n : n;
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
