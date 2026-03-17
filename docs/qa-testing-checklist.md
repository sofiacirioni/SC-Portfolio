# QA & Testing Checklist — Sofia Cirioni Portfolio

> Audit guide for validating grid alignment, animation performance, colour contrast,
> accessibility, and responsive behaviour. Run this checklist before every deployment.

---

## 1. Grid Alignment Audit

Open browser DevTools → **Layout** panel → enable grid overlay on `.global-grid` elements.

### 1.1 Global grid check

- [ ] `.page-wrapper` shows 12 equal columns with `0.75rem` gaps (desktop)
- [ ] Columns collapse to **8** at viewport `≤ 1024px`
- [ ] Columns collapse to **4** at viewport `≤ 640px`
- [ ] No element overflows its declared `grid-column` span

### 1.2 Navigation

- [ ] Logo/sc icon aligns to **col 1** left edge
- [ ] "Home" aligns to **col 3** right edge
- [ ] "About" aligns to **col 5** right edge
- [ ] "Projects" aligns to **col 9** right edge
- [ ] "Contact" aligns to **col 11** right edge
- [ ] Hover underline width matches the word width exactly (not wider/narrower)

### 1.3 About section

- [ ] `[About]` label sits at **col 1** left edge
- [ ] `HELLO!` sits at **col 6** right-aligned
- [ ] Bio text starts at **col 7** and does not overflow col 9
- [ ] Photo/ASCII placeholder occupies **cols 10–12**, rows 2–3
- [ ] Education label is at **col 2**, right-aligned
- [ ] Education content starts at **col 3**
- [ ] Experience and Languages share the **cols 6–9 subgrid**
- [ ] Experience label is right-aligned in subgrid col 1; content in subgrid cols 2–4
- [ ] Languages label is right-aligned in subgrid col 1; content in subgrid cols 2–4
- [ ] Gap between Experience content and Languages content is **27 px (1.5rem)**
- [ ] Skill cards appear every 2 columns starting from col 3; 5 cards per row
- [ ] About section background (`--color-base-accent`) breaks out to `100vw` with no horizontal gap
- [ ] 20px top border-radius visible on About card

### 1.4 Projects section

- [ ] All 4 index items have equal width (flex `1 1 0`)
- [ ] Vertical dividers between items use `border-right: 1px solid rgba(0,0,0,0.12)`
- [ ] Detail view: info column is ~290px, main image fills centre, secondary image is square
- [ ] `← index` button is not blocked by nav arrows when detail is open
- [ ] Detail gap between main image and secondary image is **18px**

### 1.5 Contact section

- [ ] `[Contact]` label at **col 1**
- [ ] Phrase occupies **cols 1–5**
- [ ] ASCII placeholder occupies **cols 7–12**, rows 1–2

### 1.6 Footer

- [ ] SOCIAL label at **col 2**
- [ ] Social buttons in **cols 2–4**
- [ ] Tagline centred in **cols 5–9**
- [ ] Go-top + credits in **cols 10–12**
- [ ] ASCII placeholder spans **cols 1–12** (full width)
- [ ] Footer background breaks to `100vw` with no horizontal scrollbar
- [ ] 20px top border-radius on footer card

---

## 2. Animation Audit

### 2.1 ASCII Hero animation

- [ ] Welcome sequence plays **once** (85 frames at 30 fps ≈ 2.8s)
- [ ] Transition to "nubes" is seamless — no blank frame, no flicker
- [ ] Nubes sequence loops **infinitely** at 10 fps without gaps
- [ ] Pause/play button toggles animation correctly from its top-right position
- [ ] On window resize, ASCII scales to fit container width without cropping
- [ ] Animation starts as soon as the first batch (40 frames) is loaded, not after all frames

### 2.2 Scramble phrase (Hero)

- [ ] Phrase appears after **4-second delay** (`baseDelayS = 4`)
- [ ] Letters appear left-to-right with stagger (~0.06s per letter)
- [ ] During scramble, random characters appear in `--color-primary` (#9da8ff)
- [ ] Final character renders in black at correct font (mono or serif per definition)
- [ ] Hovering a letter triggers scramble → toggles font (mono ↔ serif)
- [ ] Idle scramble fires a random letter while phrase is in viewport (every 6–11s)
- [ ] No idle scramble fires while phrase is scrolled out of view
- [ ] Word wrapping never splits mid-word (words use `white-space: nowrap`)

### 2.3 Scramble phrase (Contact)

- [ ] First phrase appears immediately on scroll into view
- [ ] After scramble-in completes, a **10-second** timer starts
- [ ] At 10s: phrase fades out smoothly over 0.45s
- [ ] After fade: new phrase scrambles in from scratch
- [ ] Cycling continues indefinitely without memory leaks
- [ ] `idleMinMs` is high enough (15–25s) that idle scramble does not interfere with cycling

### 2.4 Ticker tape

- [ ] Tickers are **invisible on initial page load** (only visible after scrolling)
- [ ] Speed increases proportionally to scroll velocity
- [ ] Tickers decelerate smoothly after scroll stops (exponential decay)
- [ ] Full-width tickers are `100vw` (check no clipping on sides)
- [ ] No top or bottom border on any ticker row
- [ ] Separator line (`::after`, accent colour, 80px wide) appears after each phrase
- [ ] Tickers **pause rendering when off-screen** (IntersectionObserver active)

### 2.5 Projects — open/close transition

- [ ] Clicking a project collapses the index (height 0, opacity 0) over 0.4s
- [ ] Detail view expands with left-to-right clip-path wipe (not a vertical slide)
- [ ] All 4 projects open/close correctly
- [ ] `← index` button closes the detail and restores the index
- [ ] Navigation arrows (`←` `→`) fire the `@keyframes navWipeIn` animation each time
- [ ] First/last project disables the corresponding arrow (`opacity: 0; pointer-events: none`)
- [ ] Rapid clicking while `isNavAnimating = true` is blocked

### 2.6 Scroll hint arrow

- [ ] Arrow animates downward and re-enters from the top on a 2.8s loop
- [ ] Scroll hint and "See projects" button are **hidden for 4 seconds** (scroll blocked)
- [ ] Both appear only after the hero phrase scramble-in completes

---

## 3. Colour Contrast (WCAG 2.1 AA)

Minimum contrast: **4.5:1** for normal text, **3:1** for large text (≥18px regular or ≥14px bold).

| Element | Foreground | Background | Ratio target | Check |
|---------|-----------|------------|-------------|-------|
| Body text | `#1a1a1a` | `#f2f0ec` | ≥ 4.5:1 | [ ] |
| Nav items (rest) | `#1a1a1a` | `#f2f0ec` | ≥ 4.5:1 | [ ] |
| Section labels `--color-base-secondary` | `#a1a09d` | `#f2f0ec` | ≥ 3:1 (large text) | [ ] |
| Ticker text `--color-accent` | `#0025ff` | `#f2f0ec` | ≥ 4.5:1 | [ ] |
| About section body text | `#1a1a1a` | `#d8dbea` | ≥ 4.5:1 | [ ] |
| About section subtitles `--color-secondary` | `#5b71f4` | `#d8dbea` | ≥ 3:1 | [ ] |
| Pill button at rest | `#1a1a1a` on transparent | `#f2f0ec` | ≥ 4.5:1 | [ ] |
| Pill button hover | white on `#9da8ff` | — | ≥ 4.5:1 | [ ] |
| Pill button active | white on `#0025ff` | — | ≥ 4.5:1 | [ ] |
| Footer tagline `--color-accent` | `#0025ff` | `#d8dbea` | ≥ 3:1 | [ ] |
| Scramble chars during animation | `#9da8ff` on `#f2f0ec` | — | verify ≥ 3:1 | [ ] |

> Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or Chrome DevTools accessibility panel.

---

## 4. Accessibility (A11y)

### 4.1 Keyboard navigation

- [ ] All interactive elements reachable via `Tab` key
- [ ] Visible focus ring on all focusable elements (nav links, buttons, project items, links)
- [ ] Projects index items: `role="button"`, `tabindex="0"`, respond to `Enter` and `Space`
- [ ] `← index` button in project detail is keyboard-accessible
- [ ] Navigation arrow buttons have `aria-label` ("Previous project" / "Next project")
- [ ] "Send an email" pill button is an `<a>` tag with valid `mailto:` href
- [ ] "Go top" links to `#top` anchor — verify `id="top"` exists on page wrapper

### 4.2 Screen reader

- [ ] ASCII animation has `aria-hidden="true"` — decorative, should not be announced
- [ ] All `aria-hidden="true"` placeholder divs (photo, contact-ascii, footer-ascii) are inert to screen readers
- [ ] Project index: `aria-label` on each item describes its content (`"Open P-01: Laboratory system"`)
- [ ] Skill cards: `[attr.aria-label]="'Level ' + skill.level + ' of 3'"` on dot indicators
- [ ] Scroll hint has `aria-hidden="true"` (decorative)
- [ ] Nav landmark: `<header>` wraps `<nav>` for correct landmark structure
- [ ] Main content wrapped in `<main>` with no duplicate `<main>` elements

### 4.3 Reduced motion

- [ ] Verify with `prefers-reduced-motion: reduce` media query in DevTools
- [ ] ASCII animation should pause or reduce frame rate
- [ ] Scramble should show text directly (no random chars)
- [ ] Ticker tape should stop or slow down

> **Current state:** `@media (prefers-reduced-motion)` overrides are not yet implemented. Add them before production deploy.

### 4.4 Semantic HTML

- [ ] `<header>` contains navigation
- [ ] `<main>` contains all page content
- [ ] `<section>` used for each major content area (hero, about, contact)
- [ ] `<footer>` used for the site footer
- [ ] Heading hierarchy is logical: `h1` → `h2` → `h3` (no skipped levels)
- [ ] Lists (`<ul>` / `<li>`) used for education items, experience items, skill items, social links

---

## 5. Responsive Behaviour

### 5.1 Breakpoint matrix

| Breakpoint | Grid | Layout changes to verify |
|-----------|------|--------------------------|
| `> 1024px` | 12 columns | Full desktop layout |
| `641–1024px` | 8 columns | Nav items reflow, About columns compress |
| `≤ 640px` | 4 columns | Single-column stacking for most sections |

### 5.2 Per-section responsive checks

**Navigation:**
- [ ] No overflow or wrapping at any breakpoint
- [ ] Logo always visible at col 1

**Hero:**
- [ ] ASCII animation scales correctly (no overflow, no blank space)
- [ ] Scramble phrase wraps to new line cleanly — words never break mid-character
- [ ] Scroll hint and CTA button remain accessible

**Ticker:**
- [ ] Full-width tickers stay `100vw` at all sizes
- [ ] No horizontal scroll introduced by tickers

**About:**
- [ ] Section background remains full-bleed (`100vw`) at all sizes
- [ ] Content does not overflow outside the card at mobile widths
- [ ] Skill grid reflows gracefully as columns reduce

**Projects:**
- [ ] Index items remain readable on tablet (min-height maintained)
- [ ] Detail view info column does not overflow on narrow viewports

**Contact / Footer:**
- [ ] Footer tagline remains legible at mobile
- [ ] Social buttons stack without overflow

---

## 6. Performance Checks

- [ ] **No `setInterval` leak:** verify that navigating away and back does not create duplicate intervals
- [ ] **No GSAP tween leak:** every tween created is stored and killed in `ngOnDestroy`
- [ ] **Passive event listeners:** all `scroll` and `resize` listeners use `{ passive: true }`
- [ ] **IntersectionObserver disconnect:** all observers are disconnected in `ngOnDestroy`
- [ ] **`NgZone.runOutsideAngular`:** confirm GSAP and ASCII loops do not trigger Angular change detection on every frame
- [ ] **ASCII frame requests:** confirm network tab shows batch loading, not all 693 frames simultaneously
- [ ] **Font display swap:** all `@font-face` declarations use `font-display: swap`
- [ ] **No horizontal scrollbar** at any viewport width (verify `overflow-x: hidden` on `html` and `body`)
- [ ] Lighthouse Performance score ≥ 80 on desktop

---

## 7. Visual Regression Snapshot List

Take screenshots at these states before each release:

| State | Viewport |
|-------|----------|
| Initial load (scroll blocked, no phrase yet) | 1440px |
| Hero with phrase visible + "See projects" | 1440px |
| About section fully visible | 1440px |
| Projects index (no card open) | 1440px |
| Projects — P-01 detail open | 1440px |
| Contact section — phrase 1 | 1440px |
| Contact section — phrase 2 | 1440px |
| Footer | 1440px |
| Full page scroll at 1024px (tablet) | 1024px |
| Full page scroll at 375px (mobile) | 375px |
