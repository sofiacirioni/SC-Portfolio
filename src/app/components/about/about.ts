import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ScrollRevealService } from '../../services/scroll-reveal.service';
import { I18nService } from '../../services/i18n.service';

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
  imports: [],
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
  @ViewChild('softLabel')   private softLabel!:   ElementRef<HTMLElement>;
  @ViewChildren('softItem')  private softItems!:  QueryList<ElementRef<HTMLElement>>;

  private cleanupReveal?: () => void;
  readonly i18n = inject(I18nService);

  constructor(private scrollReveal: ScrollRevealService) {}

  private get es(): boolean {
    return this.i18n.lang() === 'es';
  }

  /** Section labels + intro copy per language. */
  readonly copy = computed(() =>
    this.i18n.lang() === 'es'
      ? {
          label: '[ Sobre mí ]',
          greeting: 'Hola, soy',
          bio: 'Diseñadora gráfica y desarrolladora full-stack radicada en Argentina, especializada en UX/UI. Con un fuerte ojo para el detalle y foco en crear interfaces útiles.',
          education: 'Educación',
          experience: 'Experiencia',
          languages: 'Idiomas',
          soft: 'Habilidades blandas',
          technical: 'Habilidades técnicas',
        }
      : {
          label: '[ About ]',
          greeting: "Hello, I'm",
          bio: 'A graphic designer and full-stack developer based in Argentina, specialized in UX/UI. With a strong eye for detail and a focus on making useful interfaces.',
          education: 'Education',
          experience: 'Experience',
          languages: 'Languages',
          soft: 'Soft skills',
          technical: 'Technical skills',
        },
  );

  ngAfterViewInit(): void {
    const el = (ref: ElementRef<HTMLElement>) => ref.nativeElement;
    this.cleanupReveal = this.scrollReveal.revealSequential(
      el(this.sectionEl),
      [
        [el(this.aboutLabel)],
        [el(this.helloEl), el(this.bioEl), el(this.photoEl)],
        [el(this.eduLabel), el(this.eduContent)],
        [el(this.expLabel), el(this.expContent)],
        [el(this.langLabel), el(this.langContent)],
        [el(this.skillsLabel), ...this.skillCards.map(el)],
        [el(this.softLabel), ...this.softItems.map(el)],
      ],
    );
  }

  ngOnDestroy(): void {
    this.cleanupReveal?.();
  }

  readonly education = computed<EducationItem[]>(() =>
    this.es
      ? [
          {
            period: '2024 – 2026',
            title: 'Tecnicatura en Programación',
            institution: 'UTN – Facultad Regional Córdoba.',
          },
          {
            period: '2022 – 2024',
            title: 'Tecnicatura en Diseño Gráfico',
            institution: 'UPC – Facultad de Artes Aplicadas.',
          },
        ]
      : [
          {
            period: '2024 – 2026',
            title: 'Technical Degree in Programming',
            institution: 'UTN – Facultad Regional Córdoba.',
          },
          {
            period: '2022 – 2024',
            title: 'Technical Degree in Graphic Design',
            institution: 'UPC – Facultad de Artes Aplicadas.',
          },
        ],
  );

  readonly experience = computed<ExperienceItem[]>(() =>
    this.es
      ? [{ period: '2025 – presente', role: 'Diseñadora gráfica', detail: 'freelance' }]
      : [{ period: '2025 – present', role: 'Graphic designer', detail: 'freelance' }],
  );

  readonly languages = computed(() =>
    this.es
      ? [
          { lang: 'Inglés', level: 'B1' },
          { lang: 'Español', level: 'Nativo' },
        ]
      : [
          { lang: 'English', level: 'B1' },
          { lang: 'Spanish', level: 'Native' },
        ],
  );

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

  readonly softSkills = computed<string[]>(() =>
    this.es
      ? ['Aprendizaje rápido', 'Autodidacta', 'Metodologías ágiles', 'Resolución de problemas']
      : ['Fast learner', 'Self-taught', 'Agile methodologies', 'Problem-solving'],
  );

  iconUrl(icon: string): string {
    return `url(assets/SVG/${icon})`;
  }
}
