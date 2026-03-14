import { Component } from '@angular/core';
import { TickerTapeComponent, TickerRow } from '../ticker-tape/ticker-tape';

interface SkillItem {
  name: string;
  /** Filename inside assets/SVG/ */
  icon: string;
  /** Proficiency 1–3 */
  level: 1 | 2 | 3;
}

interface EducationItem {
  period: string;
  title: string;
  institution: string;
}

interface ExperienceItem {
  period: string;
  role: string;
  /** Text after the pipe — rendered with lighter weight */
  detail?: string;
}

@Component({
  selector: 'app-about',
  imports: [TickerTapeComponent],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  readonly levelDots = [1, 2, 3] as const;

  readonly education: EducationItem[] = [
    {
      period: '2024 – present',
      title: 'Technical Degree in Programming',
      institution: 'UTN – Facultad Regional Córdoba.',
    },
    {
      period: '2022 – 2024',
      title: 'Technical Degree in Graphic Design',
      institution: 'UPC – Facultad de Artes Aplicadas.',
    },
  ];

  readonly experience: ExperienceItem[] = [
    { period: '2025 – present', role: 'Graphic designer', detail: 'freelance' },
  ];

  readonly languages = [
    { lang: 'English', level: 'B1' },
    { lang: 'Spanish', level: 'Native' },
  ];

  /** 3 short tickers, left half of the about card */
  readonly shortTickerRows: TickerRow[] = [
    { text: '// GRAPHIC DESIGNER & FULLSTACK DEVELOPER', direction: 1 },
    { text: '// UX/UI DESIGNER — MAKING USEFUL INTERFACES', direction: -1 },
    { text: '// CÓRDOBA — ARGENTINA — MAKE IT HAPPEN', direction: 1 },
  ];

  readonly skills: SkillItem[] = [
    { name: 'Figma', icon: 'figma-logo.svg', level: 2 },
    { name: 'Illustrator', icon: 'illustrator-logo.svg', level: 3 },
    { name: 'Photoshop', icon: 'photoshop-logo.svg', level: 2 },
    { name: 'After Effects', icon: 'after-effects-logo.svg', level: 1 },
    { name: 'InDesign', icon: 'indesign-logo.svg', level: 2 },
    { name: 'Angular', icon: 'angular-logo.svg', level: 3 },
    { name: 'Node.js', icon: 'nodejs-logo.svg', level: 2 },
    { name: 'Docker', icon: 'docker-logo.svg', level: 2 },
    { name: 'Database', icon: 'db-logo.svg', level: 1 },
    { name: 'GitHub', icon: 'github-logo.svg', level: 2 },
  ];

  iconUrl(icon: string): string {
    return `url(assets/SVG/${icon})`;
  }

  /** Grid column for skill card i — 2 cols wide, starting at col 3 */
  skillColumn(i: number): string {
    return `${(i % 5) * 2 + 3} / span 2`;
  }

  /** Grid row for skill card i — first skills row is row 5 */
  skillRow(i: number): number {
    return Math.floor(i / 5) + 5;
  }
}
