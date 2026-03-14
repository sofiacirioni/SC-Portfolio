import { Component } from '@angular/core';

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
export class ProjectsSection {
  activeIndex: number | null = null;
  isNavAnimating = false;

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

    this.activeIndex = next;
    // Toggle the animation class off-then-on so the keyframe re-triggers
    this.isNavAnimating = false;
    setTimeout(() => {
      this.isNavAnimating = true;
      setTimeout(() => {
        this.isNavAnimating = false;
      }, 450);
    }, 0);
  }

  formatTags(tags: string[]): string {
    return '[ ' + tags.join(' | ') + ' ]';
  }
}
