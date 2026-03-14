import { Component } from '@angular/core';

interface Project {
  id: string;
  title: string;
  tags: string[];
  description: string;
  githubUrl?: string;
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
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      roles: ['UI Design', 'Branding'],
    },
    {
      id: 'P-03',
      title: 'Project three',
      tags: ['Freelance', 'real client'],
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      githubUrl: '#',
      roles: ['Front-end', 'UI Design'],
    },
    {
      id: 'P-04',
      title: 'Project four',
      tags: ['Academic'],
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
      roles: ['Full-stack'],
    },
  ];

  toggleActive(i: number): void {
    this.activeIndex = this.activeIndex === i ? null : i;
  }

  formatTags(tags: string[]): string {
    return '[ ' + tags.join(' | ') + ' ]';
  }
}
