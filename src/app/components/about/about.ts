import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TickerTapeComponent, TickerRow } from '../ticker-tape/ticker-tape';
import { ScrollRevealService } from '../../services/scroll-reveal.service';

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
export class About implements AfterViewInit, OnDestroy {
  @ViewChild('sectionEl')   private sectionEl!:   ElementRef<HTMLElement>;
  @ViewChild('aboutLabel')  private aboutLabel!:  ElementRef<HTMLElement>;
  @ViewChild('helloEl')     private helloEl!:     ElementRef<HTMLElement>;
  @ViewChild('bioEl')       private bioEl!:       ElementRef<HTMLElement>;
  @ViewChild('photoEl')     private photoEl!:     ElementRef<HTMLElement>;
  @ViewChild('eduLabel')    private eduLabel!:    ElementRef<HTMLElement>;
  @ViewChild('eduContent')  private eduContent!:  ElementRef<HTMLElement>;
  @ViewChild('expLabel')    private expLabel!:    ElementRef<HTMLElement>;
  @ViewChild('expContent')  private expContent!:  ElementRef<HTMLElement>;
  @ViewChild('langLabel')   private langLabel!:   ElementRef<HTMLElement>;
  @ViewChild('langContent') private langContent!: ElementRef<HTMLElement>;
  @ViewChild('skillsLabel') private skillsLabel!: ElementRef<HTMLElement>;
  @ViewChildren('skillCard') private skillCards!: QueryList<ElementRef<HTMLElement>>;

  private cleanupReveal?: () => void;

  constructor(private scrollReveal: ScrollRevealService) {}

  ngAfterViewInit(): void {
    const el = (ref: ElementRef<HTMLElement>) => ref.nativeElement;
    this.cleanupReveal = this.scrollReveal.revealSequential(
      el(this.sectionEl),
      [
        [el(this.aboutLabel), el(this.helloEl), el(this.bioEl), el(this.photoEl)],
        [el(this.eduLabel), el(this.eduContent)],
        [el(this.expLabel), el(this.expContent)],
        [el(this.langLabel), el(this.langContent)],
        [el(this.skillsLabel), ...this.skillCards.map(el)],
      ],
    );
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
  }

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
