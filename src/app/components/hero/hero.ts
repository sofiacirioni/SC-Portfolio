import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  currentFrame = '';
  isPaused = false;

  private readonly WELCOME_TOTAL = 85;
  private readonly NUBES_TOTAL = 608;
  private readonly NUBES_FRAME_START = 30;
  private readonly WELCOME_FPS = 30;
  private readonly NUBES_FPS = 10;
  private readonly INITIAL_BATCH = 40;
  private readonly BATCH_SIZE = 80;

  private welcomeFrames: (string | null)[] = new Array(85).fill(null);
  private nubesFrames: (string | null)[] = new Array(608).fill(null);

  private phase: 'welcome' | 'nubes' = 'welcome';
  private frameIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private scaleReady = false;
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild('heroSection') private sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('animPre') private preRef!: ElementRef<HTMLElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    void this.loadAndStart();
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.sectionRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.resizeObserver?.disconnect();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
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

  private async loadAndStart(): Promise<void> {
    const welcomeInitialEnd = Math.min(this.INITIAL_BATCH - 1, this.WELCOME_TOTAL - 1);
    await this.loadBatch('welcome', 0, welcomeInitialEnd);
    this.startAnimation();

    for (let start = this.INITIAL_BATCH; start < this.WELCOME_TOTAL; start += this.BATCH_SIZE) {
      const end = Math.min(start + this.BATCH_SIZE - 1, this.WELCOME_TOTAL - 1);
      await this.loadBatch('welcome', start, end);
    }

    for (let start = 0; start < this.NUBES_TOTAL; start += this.BATCH_SIZE) {
      const end = Math.min(start + this.BATCH_SIZE - 1, this.NUBES_TOTAL - 1);
      await this.loadBatch('nubes', start, end);
    }
  }

  private loadBatch(animation: 'welcome' | 'nubes', startIdx: number, endIdx: number): Promise<void> {
    const folder = animation === 'welcome' ? 'welcome-ascii-animation' : 'nubes-ascii-animation';
    const targetArray = animation === 'welcome' ? this.welcomeFrames : this.nubesFrames;
    const frameOffset = animation === 'nubes' ? this.NUBES_FRAME_START : 1;
    const promises: Promise<void>[] = [];

    for (let i = startIdx; i <= endIdx; i++) {
      const frameNum = String(i + frameOffset).padStart(4, '0');
      promises.push(
        fetch(`assets/ascii-frames/${folder}/frame_${frameNum}.txt`)
          .then((r) => {
            if (!r.ok) return '';
            return r.text();
          })
          .then((text) => {
            targetArray[i] = text;
          })
          .catch(() => {
            targetArray[i] = '';
          })
      );
    }

    return Promise.all(promises).then(() => undefined);
  }

  private startAnimation(fps: number = this.WELCOME_FPS): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.isPaused) return;

      if (this.phase === 'welcome') {
        const frame = this.welcomeFrames[this.frameIndex];
        this.frameIndex++;

        if (frame !== null) {
          this.currentFrame = frame;
          this.cdr.detectChanges();
          if (!this.scaleReady) {
            this.scaleReady = true;
            requestAnimationFrame(() => this.updateScale());
          }
        }

        if (this.frameIndex >= this.WELCOME_TOTAL) {
          this.phase = 'nubes';
          this.frameIndex = 0;
          this.startAnimation(this.NUBES_FPS);
        }
      } else {
        const frame = this.nubesFrames[this.frameIndex];
        this.frameIndex = (this.frameIndex + 1) % this.NUBES_TOTAL;

        if (frame !== null) {
          this.currentFrame = frame;
          this.cdr.detectChanges();
          if (!this.scaleReady) {
            this.scaleReady = true;
            requestAnimationFrame(() => this.updateScale());
          }
        }
      }
    }, Math.round(1000 / fps));
  }
}
