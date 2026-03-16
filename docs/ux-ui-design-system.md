# UX/UI Design System — Sofia Cirioni Portfolio

> Aesthetic reference: **Swiss / International Typographic Style** — strict grid discipline,
> functional typography, restrained palette, deliberate negative space.
> Every element must be anchored to the global 12-column grid.

---

## 1. Design Principles

| Principle | Application |
|-----------|-------------|
| **Grid supremacy** | Nothing floats freely. Every block, label, and image maps to an explicit `grid-column` value. |
| **Typographic hierarchy** | Three font families with clearly separated roles. Weight and style are the only decorative tools. |
| **Colour as signal** | Colour is used sparingly. The base palette is almost neutral; accent blues draw the eye only where intention exists. |
| **Asymmetry + tension** | Overlapping sections (tickers crossing Hero/About boundary), large phrases on one side with empty right space — contrast creates dynamism without decoration. |
| **Motion with purpose** | Animations react to user behaviour (scroll velocity → ticker speed) or reinforce narrative (welcome ASCII then idle loop). Nothing animates for its own sake. |

---

## 2. Colour Palette

All colours are defined in `src/styles.css` as CSS custom properties on `:root`.

```css
/* ── Interactive / Brand ────────────────────── */
--color-primary:       #9da8ff;   /* soft lavender — hover states, pill-btn hover bg */
--color-accent:        #0025ff;   /* electric blue  — CTAs, ticker text, active states, links */
--color-secondary:     #5b71f4;   /* mid blue       — section labels, skill icons on hover */

/* ── Surface / Background ───────────────────── */
--color-base-primary:  #f2f0ec;   /* warm off-white — page background */
--color-base-accent:   #d8dbea;   /* cool lavender  — About section bg, Footer bg */
--color-base-secondary:#a1a09d;   /* warm grey      — metadata, dates, secondary text */
```

### Semantic usage rules

| Token | Use | Never use for |
|-------|-----|---------------|
| `--color-primary` | Pill-button hover background, `[class]` labels that need warmth | Body text, headlines |
| `--color-accent` | Ticker text, `[Projects]` label phrases, link hover, active button bg, scramble animation colour during transition | Large background fills |
| `--color-secondary` | Section subtitles (Education, Experience…), skill card labels, nav items in serif state | Primary body text |
| `--color-base-primary` | Page background only | Text on light surfaces |
| `--color-base-accent` | About section card bg, Footer card bg | Interactive elements |
| `--color-base-secondary` | Dates, metadata, nav items at rest, icon fill at rest | Headings |
| `#1a1a1a` | Body text, pill-btn border/text at rest | Background |

---

## 3. Typography

### 3.1 Font families

```css
--font-body:  'IBM Plex Sans Condensed', sans-serif;   /* UI text, body, buttons */
--font-serif: 'IBM Plex Serif', serif;                 /* emphasis, italic moments */
--font-mono:  'Martian Mono', monospace;               /* labels, data, hero phrase, tickers */
```

**Loading strategy:**
- `IBM Plex Sans Condensed` → Google Fonts (weights 300 / 400 / 500)
- `IBM Plex Serif` → local files in `src/assets/fonts/IBM_Plex_Serif/` (weights 100–700, normal + italic)
- `Martian Mono` → local variable font `MartianMono-VariableFont_wdth,wght.ttf` (weight range 100–800)

### 3.2 Typographic scale

Base: `font-size: 18px` on `<html>` → `1rem = 18px`.
Ratio: **major-third (×1.25)**.

| Token | rem | px | HTML tag / usage |
|-------|-----|----|-----------------|
| `--text-sm`   | 0.800 | 14.4 | Metadata, dates, ticker text, about body |
| `--text-base` | 1.000 | 18   | `<p>` default — body copy |
| `--text-h6`   | 1.250 | 22.5 | Fine-grain headings (rarely used directly) |
| `--text-h5`   | 1.563 | 28.1 | — |
| `--text-h4`   | 1.953 | 35.2 | — |
| `--text-h3`   | 2.441 | 43.9 | `<h3>` — section subtitles |
| `--text-h2`   | 3.052 | 54.9 | `<h2>` — section titles |
| `--text-h1`   | 3.815 | 68.7 | `<h1>` — page-level headings |
| `--text-hero` | 4.768 | 85.8 | `.text-hero` — hero phrase, contact phrase |

> **Rule:** always reference tokens. Never hardcode `px` or arbitrary `rem` values
> for font sizes. Spacing may use arbitrary rem as long as it is a multiple of `0.25rem`.

### 3.3 Font role matrix

| Context | Family | Weight | Style | Size |
|---------|--------|--------|-------|------|
| Body / paragraph | IBM Plex Sans Condensed | 400 | normal | `--text-base` |
| Navigation items (rest) | IBM Plex Sans Condensed | 400 | normal | `0.85rem` |
| Navigation items (hover) | IBM Plex Serif | 700 | italic | same |
| Section labels `[About]` | Martian Mono | 300 | normal | `0.7rem` |
| Section subtitles Education/Experience… | Martian Mono | 400 | normal | `0.778rem` |
| Hero / contact phrase | Martian Mono + IBM Plex Serif | variable | mixed | `4.5–6rem` |
| Ticker tape | Martian Mono | 200 (ExtraLight) | normal | `0.9rem` |
| Pill buttons | IBM Plex Sans Condensed | 400 | normal | `0.778rem` |
| Skill names | IBM Plex Sans Condensed | 400 | normal | `--text-sm` |
| Footer tagline | IBM Plex Serif | 400 | italic | `clamp(1.8rem, 3.5vw, 3.5rem)` |
| Code / ASCII | Martian Mono | 400 | normal | fits container via CSS scale |

---

## 4. Global Grid System

Defined in `src/styles.css` as `.global-grid`.

```css
.global-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 0.75rem;        /* 13.5px at 18px base */
}
/* Tablet */
@media (max-width: 1024px) { grid-template-columns: repeat(8, 1fr); }
/* Mobile */
@media (max-width: 640px)  { grid-template-columns: repeat(4, 1fr); }
```

> `12 columns = 6 "visual" columns × 2`, giving half-column precision.
> `column-gap: 0.75rem` = the same total gutter as `6-col × 1.5rem`.
> **`padding-inline` is NOT set here** — each container applies its own `1rem` side inset.

### 4.1 How to apply

Always add `.global-grid` to the **direct parent** of grid children. Never nest `.global-grid` inside another `.global-grid` unless using `display: subgrid` (see About section skills).

```html
<!-- Correct -->
<section class="my-section global-grid">
  <div style="grid-column: 1 / span 6">...</div>
  <div style="grid-column: 7 / span 6">...</div>
</section>
```

### 4.2 Utility span classes

```css
.grid-full-span  { grid-column: 1 / -1; }   /* all 12 cols */
.grid-half-left  { grid-column: 1 / 7; }    /* cols 1–6 */
.grid-half-right { grid-column: 7 / -1; }   /* cols 7–12 */
```

### 4.3 Section column map

| Section | Element | Grid column | Notes |
|---------|---------|-------------|-------|
| **Nav** | Logo/sc | col 1 | `justify-self: start` |
| **Nav** | Home | col 3 | `justify-self: end` |
| **Nav** | About | col 5 | `justify-self: end` |
| **Nav** | Projects | col 9 | `justify-self: end` |
| **Nav** | Contact | col 11 | `justify-self: end` |
| **Hero** | ASCII animation | cols 1–12 | full width, scaled via CSS transform |
| **Hero** | Scramble phrase | cols 1–8 | overlaps ASCII |
| **Hero** | Pause/play button | top-right corner | `position: absolute` within hero |
| **Hero** | "See projects" CTA | right of phrase | `justify-self: end` in flex |
| **Hero** | Scroll hint | bottom-left | `position: relative`, margin-top from content |
| **Ticker (full)** | 4 rows | `100vw` | `margin-left: -1rem`, positioned at Hero/About boundary |
| **Ticker (short)** | 3 rows | cols 1–6 | Inside About card, `margin-left: -1rem` |
| **About** | `[About]` label | col 1 | `justify-self: start` |
| **About** | HELLO! | col 6 | `justify-self: end`, `text-align: right` |
| **About** | Bio text | cols 7–9 | — |
| **About** | Photo/ASCII placeholder | cols 10–12 | `grid-row: 2 / span 2` |
| **About** | Education label | col 2 | `text-align: right` |
| **About** | Education content | cols 3–5 | — |
| **About** | Exp + Lang wrapper | cols 6–9 | subgrid, `row-gap: 1.5rem` |
| **About** | Exp/Lang label | subgrid col 1 | `text-align: right` |
| **About** | Exp/Lang content | subgrid cols 2–4 | — |
| **About** | Technical skills label | col 2 | `align-self: center`, `text-align: right` |
| **About** | Skill cards | cols 3–12, every 2 cols | 5 per row, dynamic via `skillColumn(i)` |
| **Projects intro** | Phrases | cols 1–6 | `align-self: end` |
| **Projects intro** | ASCII placeholder | cols 7–12 | — |
| **Contact** | `[Contact]` label | col 1 | — |
| **Contact** | Phrase + email CTA | cols 1–5 | flex column |
| **Contact** | ASCII placeholder | cols 7–12 | `grid-row: 1 / span 2` |
| **Footer** | SOCIAL label | col 2 | — |
| **Footer** | Social links | cols 2–4 | flex column |
| **Footer** | Tagline | cols 5–9 | `text-align: center`, `align-self: center` |
| **Footer** | Go-top + credits | cols 10–12 | `align-items: flex-end` |
| **Footer** | ASCII placeholder | cols 1–12 | row 3, full width |

### 4.4 Full-bleed technique (About, Footer)

Sections that need a coloured background breaking out of the `1rem` side padding:

```css
.about-card,
.footer-card {
  width: 100vw;
  margin-left: -1rem;          /* compensates page-wrapper padding-inline */
  padding-inline: 1rem;        /* restores alignment for child grid */
  border-radius: 20px 20px 0 0;
  background: var(--color-base-accent);
}
```

---

## 5. Component Aesthetics

### 5.1 Pill button

- Fully rounded: `border-radius: 9999px`
- Transparent background at rest, `--color-primary` on hover, `--color-accent` on active
- Arrow icon (`↗`) shifts `translate(1px, -1px)` on hover
- Font: IBM Plex Sans Condensed, 400, `0.778rem`

### 5.2 Navigation underline effect

- On hover the font changes to IBM Plex Serif italic bold
- A `::before` pseudo-element (same text content, bold serif) pre-reserves the wider width to prevent layout shift
- An `::after` pseudo-element draws the underline: starts at `width: 0`, grows to `width: 100%` on hover
- Underline colour: `--color-accent`

### 5.3 Section labels

Format: `[ Label ]` — brackets included in the text node, Martian Mono 300, `0.7rem`, `--color-base-secondary`.

### 5.4 Ticker tape separators

Each ticker phrase ends with a `::after` pseudo-element:
```css
.ticker-copy::after {
  content: '';
  display: inline-block;
  width: 80px;
  height: 1px;
  background: var(--color-accent);
  margin-inline: 1.25rem 1.75rem;
  vertical-align: middle;
}
```
No top/bottom borders on ticker rows.

### 5.5 Skill cards (About section)

- Icon: CSS mask technique — `background-color: var(--color-base-secondary)` with `-webkit-mask-image: var(--icon-url)`; on hover changes to `var(--color-secondary)`
- Text: name and dot-level indicator occupy the same grid area (`grid-area: 1/1`) and cross-fade on hover using `opacity` transition
- Hover: NO dark background overlay — only icon colour change and name↔dots swap

---

## 6. Spacing Rhythm

Base unit: `0.25rem = 4.5px`. All spacing values should be multiples of this.

| Use | Value |
|-----|-------|
| Section vertical padding | `5rem` top, `4–6rem` bottom |
| Page side inset | `1rem` (`padding-inline: 1rem` on `.page-wrapper`) |
| Grid column gap | `0.75rem` |
| Hero phrase → button margin | `-3rem` (intentional overlap) |
| Scroll hint top margin | `5rem` |
| Scroll hint bottom margin | `3rem` (keeps tickers hidden on initial viewport) |
| Hero scene min-height | `calc(100svh - 3.5rem)` |
| About/Footer top border-radius | `20px` |
| Card-to-card section gap | `3–4rem` |
| Experience ↔ Languages gap | `1.5rem` (27px, via subgrid `row-gap`) |
