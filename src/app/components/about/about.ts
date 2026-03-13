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
      institution: 'UTN – Facultad regional Córdoba.',
    },
    {
      period: '2022 – 2024',
      title: 'Technical Degree in Graphic Design',
      institution: 'UPC – Facultad de artes aplicadas.',
    },
  ];

  readonly experience: ExperienceItem[] = [
    { period: '2025 – present', role: 'Graphic designer | freelance' },
  ];

  readonly languages = [
    { lang: 'English', level: 'B1' },
    { lang: 'Spanish', level: 'Native' },
  ];

  /** 3 short tickers, left half of the about card */
  readonly shortTickerRows: TickerRow[] = [
    { text: '// GRAPHIC DESIGNER & FULLSTACK DEVELOPER', direction: 1 },
    { text: '// UX/UI SPECIALIST — MAKING USEFUL INTERFACES', direction: -1 },
    { text: '// CÓRDOBA · ARGENTINA — AVAILABLE FOR FREELANCE', direction: 1 },
  ];

  readonly skills: SkillItem[] = [
    { name: 'Figma', icon: 'figma-logo.svg', level: 3 },
    { name: 'Illustrator', icon: 'illustrator-logo.svg', level: 3 },
    { name: 'Photoshop', icon: 'photoshop-logo.svg', level: 2 },
    { name: 'After Effects', icon: 'after-effects-logo.svg', level: 2 },
    { name: 'InDesign', icon: 'indesign-logo.svg', level: 2 },
    { name: 'Angular', icon: 'angular-logo.svg', level: 3 },
    { name: 'Node.js', icon: 'nodejs-logo.svg', level: 2 },
    { name: 'Docker', icon: 'docker-logo.svg', level: 1 },
    { name: 'Database', icon: 'db-logo.svg', level: 2 },
    { name: 'GitHub', icon: 'github-logo.svg', level: 3 },
  ];

  iconUrl(icon: string): string {
    return `url(assets/SVG/${icon})`;
  }
}
