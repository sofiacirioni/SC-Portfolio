# Frontend Architecture & Clean Code Guide

> Stack: **Angular 17+ (standalone components)** · **Pure CSS** · **GSAP** for animation
> No UI framework. No CSS-in-JS. No component library. Every pixel is intentional.

---

## 1. Project Overview

Single-Page Application (SPA) built as a personal portfolio. The page is a single long-scroll document divided into thematic sections: Hero, About, Projects Intro, Projects Accordion, Contact, Footer.

```
src/
├── app/
│   ├── pages/
│   │   └── home/          home.ts · home.html · home.css
│   └── components/
│       ├── nav/
│       ├── hero/
│       ├── scramble-phrase/
│       ├── pill-btn/
│       ├── ticker-tape/
│       ├── about/
│       ├── projects/
│       ├── contact/
│       └── footer/
├── assets/
│   ├── ascii-frames/
│   │   ├── welcome-ascii-animation/   frame_0001.txt … frame_0085.txt
│   │   └── nubes-ascii-animation/     frame_0030.txt … frame_0637.txt
│   ├── fonts/
│   │   ├── Martian_Mono/
│   │   └── IBM_Plex_Serif/
│   └── svg/               (skill icons)
└── styles.css             (global tokens, grid, font-face)
```

---

## 2. Angular Conventions

### 2.1 Standalone components

Every component uses `standalone: true` (implicit in Angular 17+ with `imports: []` directly in `@Component`). No `NgModule` is used.

```typescript
@Component({
  selector: 'app-example',
  imports: [OtherComponent, CommonModule],
  templateUrl: './example.html',
  styleUrl: './example.css',
})
export class ExampleComponent { ... }
```

### 2.2 Lifecycle hooks used

| Hook | Purpose |
|------|---------|
| `ngOnInit` | Start async data loading (ASCII frames), parse input data (scramble phrase lines) |
| `ngAfterViewInit` | Access DOM (`@ViewChild`), initialise GSAP, attach observers |
| `ngOnDestroy` | Kill all GSAP tweens, clear intervals/timeouts, disconnect observers, remove event listeners |

> **Rule:** Always clean up in `ngOnDestroy`. Memory leaks from dangling `setInterval`, GSAP tweens, and `IntersectionObserver` instances are the #1 source of bugs.

### 2.3 DOM access pattern

```typescript
@ViewChild('heroSection') private sectionRef!: ElementRef<HTMLElement>;
@ViewChild('animPre')     private preRef!: ElementRef<HTMLElement>;
```

Never use `document.querySelector` inside components. Always use `@ViewChild` or `inject(DOCUMENT)` for document-level operations.

### 2.4 Change detection

Components that run intensive animation loops (ticker, scramble) use `NgZone.runOutsideAngular()` to keep GSAP completely outside Angular's change detection cycle. Only re-enter the zone when Angular state must update:

```typescript
constructor(private ngZone: NgZone) {}

ngAfterViewInit(): void {
  this.ngZone.runOutsideAngular(() => {
    // all GSAP / DOM animation here
    gsap.ticker.add(this.tickerFn);
  });
}

// Re-enter zone only for Angular-visible state:
gsap.delayedCall(delay, () => {
  this.ngZone.run(() => this.complete.emit());
});
```

For the Hero component, `ChangeDetectorRef.detectChanges()` is called manually after each ASCII frame update since the component runs outside the default zone:

```typescript
constructor(private cdr: ChangeDetectorRef) {}
// ...
this.currentFrame = frame;
this.cdr.detectChanges();
```

---

## 3. ASCII Animation System (Hero)

### 3.1 Architecture

Two animation sequences live in `src/app/components/hero/hero.ts`:

| Sequence | Frames | FPS | Behaviour |
|----------|--------|-----|-----------|
| `welcome` | 85 frames (frame_0001–frame_0085) | 30 | Plays once on load |
| `nubes` | 608 frames (frame_0030–frame_0637) | 10 | Loops infinitely after welcome |

Frames are plain `.txt` files loaded via `fetch()` from `assets/ascii-frames/`.

### 3.2 Loading strategy — batched async

To avoid blocking the UI, frames are loaded in batches while the animation is already running:

```typescript
private readonly INITIAL_BATCH = 40;   // minimum frames needed to start
private readonly BATCH_SIZE    = 80;   // subsequent batch size

private async loadAndStart(): Promise<void> {
  // 1. Load first batch of welcome frames
  await this.loadBatch('welcome', 0, INITIAL_BATCH - 1);
  this.startAnimation();                // animation starts immediately

  // 2. Load remaining welcome frames in background
  for (let start = INITIAL_BATCH; start < WELCOME_TOTAL; start += BATCH_SIZE) {
    await this.loadBatch('welcome', start, ...);
  }

  // 3. Load all nubes frames in background
  for (let start = 0; start < NUBES_TOTAL; start += BATCH_SIZE) {
    await this.loadBatch('nubes', start, ...);
  }
}
```

Frame arrays are pre-allocated: `new Array(85).fill(null)`. Frames are stored at their index. If a frame slot is still `null` when the animator reaches it, the previous frame is simply held (no skip, no crash).

### 3.3 Frame numbering

```typescript
// welcome: frame_0001 … frame_0085  (offset = 1)
// nubes:   frame_0030 … frame_0637  (offset = 30)
const frameNum = String(index + frameOffset).padStart(4, '0');
const url = `assets/ascii-frames/${folder}/frame_${frameNum}.txt`;
```

### 3.4 Phase transition

```
welcome phase  →  plays WELCOME_TOTAL frames  →  phase = 'nubes'
nubes phase    →  loops: frameIndex = (frameIndex + 1) % NUBES_TOTAL
```

When entering `nubes` phase, `startAnimation()` is called with the lower FPS (10 fps):

```typescript
if (this.frameIndex >= this.WELCOME_TOTAL) {
  this.phase = 'nubes';
  this.frameIndex = 0;
  this.startAnimation(this.NUBES_FPS);  // restarts setInterval at 10 fps
}
```

### 3.5 Responsive scaling

The `<pre>` element containing ASCII art has a natural width determined by its font and content. A `ResizeObserver` watches the container section width and applies a `transform: scale()` to fit it exactly:

```typescript
private updateScale(): void {
  const scale = sectionWidth / preNaturalWidth;
  pre.style.transform = `translateX(-50%) scale(${scale})`;
  section.style.height = `${pre.scrollHeight * scale}px`;
}
```

`translateX(-50%)` is paired with `left: 50%` in CSS so the `<pre>` anchors to the centre before scaling.

---

## 4. Scramble Phrase Component

**File:** `src/app/components/scramble-phrase/scramble-phrase.ts`

### 4.1 Inputs

```typescript
@Input() lines: ScrambleWordDef[][]  // array of lines; each line = array of word objects
@Input() baseDelayS = 0              // seconds to wait before first letter appears
@Input() fontSize = '6rem'           // CSS value applied to each .phrase line
@Input() idleMinMs = 6000            // min ms between idle scramble triggers
@Input() idleMaxMs = 11000           // max ms between idle scramble triggers
@Output() complete: EventEmitter<void>  // fires when last letter finishes scramble-in
```

### 4.2 Word definition

```typescript
interface ScrambleWordDef {
  text: string;
  font?: 'mono' | 'serif';   // default: 'mono'
}

// Example — hero phrase:
const heroLines: ScrambleWordDef[][] = [
  [{ text: 'Inspire' }],
  [{ text: 'through' }, { text: 'design' }],
];

// Example — contact phrase with serif word:
const phrase: ScrambleWordDef[][] = [
  [{ text: 'Want' }, { text: 'to', font: 'serif' }],
  [{ text: 'work' }],
  [{ text: 'together?' }],
];
```

### 4.3 Animation algorithm

**Step 1 — Width lock:** Each `.phrase-letter` span's `offsetWidth` is measured and set as `minWidth` to prevent layout shift during character replacement.

**Step 2 — Scramble-in (load):** Letters animate left-to-right with a stagger of `0.06s` each. GSAP `delayedCall` schedules each letter. Each letter runs `runScramble()`:
- A GSAP tween drives `t: 0 → 1` over `0.5s`
- On each frame update (throttled to 80ms), a random character from `SCRAMBLE_CHARS` is shown in a random font (mono or serif) and in `--color-primary`
- On complete: the final character is rendered in the correct font and colour

**Step 3 — Hover:** Toggles the letter between `mono` and `serif` fonts, running the same scramble animation.

**Step 4 — Idle scramble:** After scramble-in completes, a random letter fires the scramble animation every `idleMinMs–idleMaxMs` milliseconds — only while the component is visible (guarded by `IntersectionObserver`).

### 4.4 Contact section — cycling phrases

The `ContactSection` component (`contact/contact.ts`) manages two alternating phrases by destroying and recreating the `ScramblePhraseComponent` via `@if`:

```typescript
// Cycle logic:
onPhraseComplete() → setTimeout(10000) → startExit()
startExit() → phraseExiting = true  (CSS fade-out: opacity 0 in 0.45s)
           → phraseVisible = false  (destroys scramble component)
           → phraseIndex++
           → phraseVisible = true   (creates new component → ngAfterViewInit fires → scramble-in)
```

CSS fade wraps the `@if`:
```css
.contact-phrase-wrapper { opacity: 1; transition: opacity 0.45s ease; }
.contact-phrase-wrapper.is-exiting { opacity: 0; }
```

---

## 5. Ticker Tape Component

**File:** `src/app/components/ticker-tape/ticker-tape.ts`

### 5.1 Scroll-velocity driven motion

The ticker only moves when the user is scrolling. Speed is proportional to scroll velocity:

```typescript
// Velocity calculation (each scroll event)
const instant = (window.scrollY - lastScrollY) / Math.max(16, dt);
scrollVelocity = scrollVelocity * 0.6 + instant * 0.4;  // lerp smoothing

// Decay (every GSAP tick, regardless of scroll)
scrollVelocity *= 0.88;

// Position update (only when visible)
const speed = Math.abs(scrollVelocity) * SPEED_MULTIPLIER; // SPEED_MULTIPLIER = 3
positions[i] = (positions[i] + speed) % copyWidth;
track.style.transform = `translateX(-${positions[i]}px)`;
```

**Direction:** `direction: 1` → moves left; `direction: -1` → moves right.

### 5.2 Seamless looping

Each row duplicates its text content **4 times** in the DOM. The position wraps at `copyWidth` (width of one copy), making the loop invisible:

```
[copy 1][copy 2][copy 3][copy 4]
         ↑ position wraps here seamlessly
```

`ResizeObserver` re-measures `copyWidth` on container resize.

### 5.3 Performance guards

- `IntersectionObserver`: stops updating `transform` when the component is off-screen
- GSAP ticker: the velocity decay runs even when off-screen so that when the user scrolls back, the ticker accelerates smoothly
- `{ passive: true }` on all scroll/resize listeners

### 5.4 Placement — two types

| Type | Width | Location | z-index | Purpose |
|------|-------|----------|---------|---------|
| Full-width (4 rows) | `100vw` | `.boundary-tickers` div between Hero and About | 20 | Crosses the section boundary visually |
| Short (3 rows) | `grid-column: 1 / 7` (left half) | Inside `.about-card` | 20 | Stays within About card |

Full-width tickers use `margin-left: -1rem` to break out of the page padding. Both types have no border (top/bottom borders removed).

---

## 6. Projects Section

**File:** `src/app/components/projects/projects.ts`

### 6.1 State model

```typescript
activeIndex: number | null = null;   // null = index view, n = detail view
isNavAnimating = false;               // prevents rapid clicks during animation
```

### 6.2 Index ↔ Detail transition

**Open:** `openProject(i)` sets `activeIndex = i`.
- `.projects-index` collapses via `height: 0; opacity: 0` CSS transition
- `.project-detail` expands via `height: 60vh` CSS transition

**Animate-in:** `.project-detail-inner` uses `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)` — a left-to-right wipe. Applied on `is-visible` class:

```css
.project-detail-inner {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s;
}
.project-detail.is-visible .project-detail-inner { clip-path: inset(0 0% 0 0); }
```

**Navigate between projects:** A CSS `@keyframes` animation re-triggers on each navigation:

```css
@keyframes navWipeIn {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
.project-detail-inner.is-nav-animating {
  animation: navWipeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
```

TypeScript toggles the class off then on with `setTimeout(0)` to force a reflow:

```typescript
navigate(direction: 1 | -1): void {
  this.activeIndex = next;
  this.isNavAnimating = false;
  setTimeout(() => {
    this.isNavAnimating = true;
    setTimeout(() => { this.isNavAnimating = false; }, 450);
  }, 0);
}
```

### 6.3 Detail view layout

A 5-column CSS grid with gap columns baked in:

```css
.project-detail-inner {
  display: grid;
  /* [info 290px] [gap 1.5rem] [main img 1fr] [gap 18px] [secondary img] */
  grid-template-columns: 290px 1.5rem 1fr 18px clamp(140px, 18vw, 210px);
  gap: 0;
}
```

Images use explicit `grid-column: 3` and `grid-column: 5` to skip the gap columns.

---

## 7. CSS Architecture Rules

### 7.1 No CSS frameworks (effectively)

Tailwind is installed but used **only for its base reset** (`@tailwind base`). No utility classes are used in components. All styling is written as plain CSS in `.css` files colocated with each component.

### 7.2 File structure

Each component has its own `.css` file. Global tokens only live in `src/styles.css`. Never define colours, font variables, or grid system in component-level CSS.

### 7.3 CSS custom properties for dynamic values

Icons use CSS custom properties set via Angular style binding:

```html
<div class="skill-icon" [style.--icon-url]="iconUrl(skill.icon)"></div>
```

```css
.skill-icon {
  -webkit-mask-image: var(--icon-url);
  mask-image: var(--icon-url);
  background-color: var(--color-base-secondary);
}
```

### 7.4 Full-bleed sections

Sections that need to break out of the `1rem` page padding use this pattern:

```css
.section-card {
  width: 100vw;
  margin-left: -1rem;
  padding-inline: 1rem;  /* restore alignment */
  overflow: hidden;       /* clip border-radius */
}
```

`overflow-x: hidden` is set on both `html` and `body` to prevent the horizontal scrollbar this would otherwise cause.

### 7.5 Subgrid usage

The About section's Experience + Languages block uses `display: grid; grid-template-columns: subgrid` inside a parent grid cell to inherit the parent's exact column tracks. This gives precise label-to-content alignment:

```css
.about-exp-lang-wrapper {
  grid-column: 6 / span 4;  /* spans parent cols 6–9 */
  display: grid;
  grid-template-columns: subgrid;
  row-gap: 1.5rem;           /* 27px between Experience and Languages */
}
```

---

## 8. GSAP Integration

GSAP is the only animation library. It is used for:

| Feature | GSAP API used |
|---------|---------------|
| Scramble letter animation | `gsap.to()` with `onUpdate` / `onComplete` |
| Scheduled delays (phrase stagger) | `gsap.delayedCall()` |
| Ticker tape global loop | `gsap.ticker.add()` / `.remove()` |
| Cleanup | `tween.kill()` |

**Never** use GSAP for layout or colour changes that CSS transitions can handle. GSAP is reserved for cases where JavaScript-driven per-frame logic is necessary.

**Always** run GSAP code inside `NgZone.runOutsideAngular()` for performance. Re-enter the zone only when Angular state must change (emit events, update bound properties).

---

## 9. Scroll Blocking

During the initial 4-second welcome animation, page scroll is disabled:

```typescript
// home.ts constructor
this.doc.body.style.overflow = 'hidden';

// Restored when phrase completes
onPhraseComplete(): void {
  this.phraseReady = true;
  this.doc.body.style.overflow = '';
}

// Always restored on destroy
ngOnDestroy(): void {
  this.doc.body.style.overflow = '';
}
```

The scroll hint and "See projects" button use `opacity: 0` with a CSS transition, toggled by the `phraseReady` state:

```css
.scroll-hint, .hero-cta { opacity: 0; transition: opacity 0.5s ease; }
.scroll-hint.phrase-ready, .hero-cta.phrase-ready { opacity: 1; }
```
