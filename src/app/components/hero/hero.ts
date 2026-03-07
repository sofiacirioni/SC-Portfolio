import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit, OnDestroy {
  currentFrame = '';
  isPaused = false;

  private readonly TOTAL_FRAMES = 636;
  private readonly FPS = 10;
  private readonly INITIAL_BATCH = 40;
  private readonly BATCH_SIZE = 80;

  private frames: (string | null)[] = new Array(636).fill(null);
  private frameIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    void this.loadAndStart();
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  private async loadAndStart(): Promise<void> {
    await this.loadBatch(0, this.INITIAL_BATCH - 1);
    this.startAnimation();

    for (let start = this.INITIAL_BATCH; start < this.TOTAL_FRAMES; start += this.BATCH_SIZE) {
      const end = Math.min(start + this.BATCH_SIZE - 1, this.TOTAL_FRAMES - 1);
      await this.loadBatch(start, end);
    }
  }

  private loadBatch(startIdx: number, endIdx: number): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = startIdx; i <= endIdx; i++) {
      const frameNum = String(i + 1).padStart(4, '0');
      promises.push(
        fetch(`assets/ascii-frames/frame_${frameNum}.txt`)
          .then((r) => r.text())
          .then((text) => {
            this.frames[i] = text;
          })
          .catch(() => {
            this.frames[i] = '';
          })
      );
    }

    return Promise.all(promises).then(() => undefined);
  }

  private startAnimation(): void {
    this.intervalId = setInterval(() => {
      if (this.isPaused) return;

      const frame = this.frames[this.frameIndex];
      this.frameIndex = (this.frameIndex + 1) % this.TOTAL_FRAMES;

      if (frame !== null) {
        this.currentFrame = frame;
        this.cdr.detectChanges();
      }
    }, Math.round(1000 / this.FPS));
  }
}
