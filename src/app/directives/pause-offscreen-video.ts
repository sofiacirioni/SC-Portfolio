import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
} from '@angular/core';

/**
 * Plays a `<video>` only while it is in the viewport and pauses it when it
 * scrolls out — keeps several autoplaying gallery clips from all decoding at
 * once. Runs its IntersectionObserver outside Angular (no change detection).
 */
@Directive({
  selector: 'video[appPauseOffscreen]',
  standalone: true,
})
export class PauseOffscreenVideo implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLVideoElement>,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    const video = this.el.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) void video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.15 },
      );
      this.observer.observe(video);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
