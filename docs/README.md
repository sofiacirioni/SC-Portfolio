# Sofia Cirioni — Personal Portfolio SPA

Personal portfolio website for Sofia Cirioni, graphic designer and full-stack developer.
Single-page, long-scroll experience built with **Angular 21** and **pure CSS**.
No UI frameworks. No routing. No component libraries.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, no NgModule) |
| Styling | Pure CSS (custom properties, CSS Grid, subgrid) |
| Animation | GSAP 3 (`gsap.ticker`, `gsap.to`, `gsap.delayedCall`) |
| Fonts | Martian Mono (local variable font) · IBM Plex Serif (local) · IBM Plex Sans Condensed (Google Fonts) |
| Build | Angular CLI + esbuild (`@angular/build`) |
| Package manager | npm |

**Intentionally excluded:** `@angular/router`, `@angular/forms`, Tailwind, any icon library, any CSS framework.

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

---

## Running the project

```bash
# Install dependencies
npm install

# Start dev server → http://localhost:4200
npm start
```

The dev server hot-reloads on every file save.

```bash
# Production build → dist/portfolio/
npm run build
```

---

## Project structure

```
src/
├── app/
│   ├── app.ts / app.html          Root component (mounts <app-home>)
│   ├── app.config.ts              Application config (no providers beyond error listeners)
│   ├── pages/
│   │   └── home/                  Single page — home.ts · home.html · home.css
│   └── components/
│       ├── nav/                   Navigation bar with animated underline
│       ├── hero/                  ASCII animation player (welcome → nubes loop)
│       ├── scramble-phrase/       Reusable GSAP scramble text component
│       ├── pill-btn/              Reusable rounded CTA button
│       ├── ticker-tape/           Scroll-velocity-driven horizontal ticker
│       ├── about/                 About section (education, skills, bio)
│       ├── projects/              Expandable project accordion
│       ├── contact/               Alternating scramble phrases + email CTA
│       └── footer/                Social links, tagline, credits
├── assets/
│   ├── ascii-frames/
│   │   ├── welcome-ascii-animation/   frame_0001.txt … frame_0085.txt  (30 fps, plays once)
│   │   └── nubes-ascii-animation/     frame_0030.txt … frame_0637.txt  (10 fps, loops)
│   ├── fonts/
│   │   ├── Martian_Mono/
│   │   └── IBM_Plex_Serif/
│   └── svg/                           Skill icon files (CSS-mask technique for colouring)
└── styles.css                         Global tokens, reset, grid system, font-face declarations
```

---

## Key architecture decisions

### Single page, no router
Everything lives in `HomeComponent`. There is no `RouterModule` or route configuration. Sections are navigated via anchor links (`href="#projects"`, `href="#top"`).

### Global 12-column grid
`.global-grid` is defined in `src/styles.css` and applied to section containers:
```css
.global-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 0.75rem;
}
```
Breakpoints: 8 columns ≤ 1024 px · 4 columns ≤ 640 px.
Every element's horizontal position is declared via `grid-column`. Nothing floats freely.

### CSS custom properties — design tokens
All colours, font families, and typographic sizes are defined on `:root` in `styles.css`.
Never hardcode hex values or `px` font sizes inside components.

```css
--color-primary:      #9da8ff;   /* hover states */
--color-accent:       #0025ff;   /* CTAs, tickers, active */
--color-secondary:    #5b71f4;   /* section labels */
--color-base-primary: #f2f0ec;   /* page background */
--color-base-accent:  #d8dbea;   /* About + Footer background */
--color-base-secondary: #a1a09d; /* metadata, dates */

--font-body:  'IBM Plex Sans Condensed', sans-serif;
--font-serif: 'IBM Plex Serif', serif;
--font-mono:  'Martian Mono', monospace;

/* Major-third scale · base 1rem = 18px */
--text-sm:   0.800rem;   /* 14.4 px */
--text-base: 1.000rem;   /* 18 px   */
--text-h3:   2.441rem;   /* 43.9 px */
--text-h2:   3.052rem;   /* 54.9 px */
--text-h1:   3.815rem;   /* 68.7 px */
--text-hero: 4.768rem;   /* 85.8 px */
```

### ASCII animation (Hero)
Frames are `.txt` files fetched via the native `fetch()` API in batches while the animation already plays. Two sequences: `welcome` (plays once at 30 fps) → `nubes` (infinite loop at 10 fps). The `<pre>` element is scaled to fit the container using `ResizeObserver` + CSS `transform: scale()`.

### Scramble phrase
`ScramblePhraseComponent` accepts a `lines: ScrambleWordDef[][]` input (array of lines, each containing words with optional `font: 'mono' | 'serif'`). GSAP drives character randomisation during scramble-in. The component is reused in the Hero section (one-shot) and the Contact section (cycling between two phrases every 10 s via `@if` destroy/recreate pattern).

### Ticker tape
Scroll-velocity-driven. `GSAP.ticker` runs the animation loop; scroll events update a velocity value that decays exponentially each frame. `IntersectionObserver` pauses rendering when off-screen. Four text copies ensure seamless looping regardless of viewport width.

### NgZone strategy
All GSAP code and DOM animation runs inside `NgZone.runOutsideAngular()` to avoid triggering Angular change detection on every animation frame. Angular state is only updated (via `ngZone.run()` or `cdr.detectChanges()`) when a bound property actually needs to change.

---

## Detailed documentation

| File | Contents |
|------|----------|
| `docs/ux-ui-design-system.md` | Colour palette, typographic scale, grid column map per section, spacing rhythm, component aesthetics |
| `docs/frontend-clean-code.md` | Angular conventions, ASCII animation system, scramble algorithm, ticker architecture, projects transition, CSS patterns |
| `docs/qa-testing-checklist.md` | Grid alignment audit, animation correctness, WCAG contrast table, accessibility, responsive breakpoints |
