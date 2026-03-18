import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import gsap from 'gsap';
import { ScrollRevealService } from '../../services/scroll-reveal.service';

export interface Project {
  id: string;
  title: string;
  tags: string[];
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  roles: string[];
}

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class ProjectsSection implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl')  private sectionEl!:  ElementRef<HTMLElement>;
  @ViewChild('detailInner') private detailInner?: ElementRef<HTMLElement>;
  private cleanupReveal?: () => void;

  constructor(
    private scrollReveal: ScrollRevealService,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.cleanupReveal = this.scrollReveal.reveal(this.sectionEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
  }

  activeIndex: number | null = null;
  private isNavAnimating = false;

  readonly projects: Project[] = [
    {
      id: 'P-01',
      title: 'Laboratory system',
      tags: ['Academic proyect', 'colaborative', 'real client'],
      description:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.',
      githubUrl: '#',
      roles: ['Software development', 'Front-end', 'UI Design'],
    },
    {
      id: 'P-02',
      title: 'Project two',
      tags: ['Personal'],
      description:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      roles: ['UI Design', 'Branding'],
    },
    {
      id: 'P-03',
      title: 'Project three',
      tags: ['Freelance', 'real client'],
      description:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      githubUrl: '#',
      roles: ['Front-end', 'UI Design'],
    },
    {
      id: 'P-04',
      title: 'Project four',
      tags: ['Academic'],
      description:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      roles: ['Full-stack'],
    },
  ];

  get activeProject(): Project | null {
    return this.activeIndex !== null ? this.projects[this.activeIndex] : null;
  }

  openProject(i: number): void {
    this.activeIndex = i;
  }

  closeProject(): void {
    this.activeIndex = null;
  }

  navigate(direction: 1 | -1): void {
    if (this.activeIndex === null || this.isNavAnimating) return;
    const next = this.activeIndex + direction;
    if (next < 0 || next >= this.projects.length) return;

    this.isNavAnimating = true;
    const inner = this.detailInner?.nativeElement;

    if (!inner) {
      this.activeIndex = next;
      this.isNavAnimating = false;
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Phase 1: fade out current content
      gsap.to(inner, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          // Phase 2: swap content inside Angular zone (invisible, no flash)
          this.ngZone.run(() => { this.activeIndex = next; });

          // Phase 3: fade + subtle slide in after Angular renders new content
          setTimeout(() => {
            gsap.fromTo(
              inner,
              { opacity: 0, y: direction * 12 },
              {
                opacity: 1,
                y: 0,
                duration: 0.65,
                ease: 'power3.out',
                onComplete: () => {
                  gsap.set(inner, { clearProps: 'opacity,transform' });
                  this.ngZone.run(() => { this.isNavAnimating = false; });
                },
              },
            );
          }, 0);
        },
      });
    });
  }

  formatTags(tags: string[]): string {
    return '[ ' + tags.join(' | ') + ' ]';
  }
}
