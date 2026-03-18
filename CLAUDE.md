# CLAUDE.md — Sofia Cirioni Portfolio SPA

Resumen de avance por sesión y contexto rápido para Claude Code.
La documentación completa vive en `/docs/` — este archivo es un índice operativo, no una copia.

---

## Stack y restricciones clave

- **Angular 21** standalone (sin NgModule, sin router, sin forms)
- **CSS puro** — Tailwind solo para base reset, sin utilities en componentes
- **GSAP 3** para animaciones — siempre dentro de `NgZone.runOutsideAngular()`
- **Sin librerías de UI**, sin Angular Material, sin CSS frameworks
- Tokens CSS en `src/styles.css` (:root) — nunca hardcodear px/hex en componentes
- Grid 12 cols (`.global-grid`), `column-gap: 0.75rem`, `padding-inline: 1rem` en `.page-wrapper`

---

## Documentación de referencia

| Archivo | Contenido |
|---------|-----------|
| `docs/README.md` | Stack, estructura, decisiones de arquitectura |
| `docs/ux-ui-design-system.md` | Paleta, tipografía, grid por sección, spacing |
| `docs/frontend-clean-code.md` | Convenciones Angular, ASCII system, scramble, ticker, projects |
| `docs/qa-testing-checklist.md` | Checklist completo antes de deploy |

---

## Estado de componentes

| Componente | Estado | Notas |
|------------|--------|-------|
| `services/scroll-reveal.service.ts` | ✅ Completo | `reveal()` + `revealSequential()`, bidireccional, exit suave, threshold 0.22/0.28 |
| `nav/` | ✅ Completo | Underline serif italic on hover, `::before` reserva ancho |
| `hero/` | ✅ Completo | ASCII 85f@30fps (welcome) → 608f@10fps (nubes loop), scramble phrase, ResizeObserver scale |
| `scramble-phrase/` | ✅ Completo | Reutilizable, `lines: ScrambleWordDef[][]`, idle scramble, `complete` EventEmitter |
| `pill-btn/` | ✅ Completo | CTA reutilizable, hover `--color-primary`, active `--color-accent` |
| `ticker-tape/` | ✅ Completo | Scroll-velocity driven, reveal scroll-driven desde los extremos por clip-path, `SPEED_MULTIPLIER = 5` |
| `about/` | ✅ Completo | Reveal secuencial por bloques (card → intro → edu → exp → lang → skills), `@ViewChildren` para skill cards |
| `projects/` | ✅ Completo | Acordeón, nav GSAP crossfade (fade-out → swap → fade-in+y), `border-top` en detail view, info col 340px |
| `contact/` | ✅ Completo | Scramble inicia al entrar en viewport (IntersectionObserver), botón `mailto:sofiacirioni07@gmail.com` alineado arriba |
| `footer/` | ✅ Completo | Social links, tagline IBM Plex Serif italic, go-top |

---

## Historial de sesiones

### Sesión 1 — 2026-03-16 (id: 1d3920bc-0c17-4c27-ae8e-2a46816fea77)

**Rama:** `feature/contact-section` → mergeada a `develop`

**Trabajo realizado:**
- Implementación de `contact/` y `footer/`
- Limpieza de dependencias no usadas, creación de `.claudeignore`
- Setup de workflow de revisión con Gemini

---

### Sesión 2 — 2026-03-17

**Rama:** `develop`

**Trabajo realizado:**
- Creado `scroll-reveal.service.ts` con `reveal()` bidireccional + repeatable
- Aplicado scroll reveal en `about`, `projects`, `contact`, `footer`
- Fix doble scrollbar: `overflow-x: clip` en `html` y `body`
- Fix footer whitespace: y-offset solo se aplica al disparar la animación, no en init
- Fix footer padding derecho mínimo 27px

---

### Sesión 3 — 2026-03-18

**Rama:** `develop`

**Trabajo realizado:**

#### ScrollRevealService — refactor completo
- Nuevo método `revealSequential(trigger, groups[][], staggerDelay)`:
  - Observa el trigger (sección), anima grupos en secuencia con stagger de 0.18s
  - Entrance: `y: 36` (desde abajo) o `-36` (desde arriba) + `opacity 0→1`, `duration: 0.85s`, `ease: power3.out`
  - Exit suave: `gsap.to()` con `duration: 0.45s`, `ease: power2.in` (reemplaza el `gsap.set` instantáneo)
  - Threshold: 0.28 para sequential, 0.22 para reveal simple
- `reveal()` también recibe exit suave (no más snap instantáneo al salir)

#### About — reveal secuencial por bloques
- Grupos: `[cardEl]` → `[label, hello, bio, photo]` → `[eduLabel, eduContent]` → `[expLabel, expContent]` → `[langLabel, langContent]` → `[skillsLabel, ...skillCards]`
- `#cardEl` en `.about-card` → el fondo aparece primero como grupo 0
- `@ViewChildren('skillCard')` para animar las cards individuales (`.about-skills-grid` usa `display:contents`)

#### Projects — navegación arreglada + ajustes visuales
- **Bug flash corregido**: GSAP crossfade puro en `navigate()`:
  - `gsap.to(inner, { opacity: 0, 0.3s })` → `ngZone.run(() => activeIndex = next)` → `gsap.fromTo(inner, { opacity:0, y:±12 }, { opacity:1, y:0, 0.65s })`
  - El swap de `activeIndex` ocurre dentro de `ngZone.run()` desde el `onComplete` de GSAP → no hay frame visible entre contenidos
- `border-top` en `.project-detail.is-visible` (solo al expandir, evita double border con index)
- Info col: 290px → 340px; título: `--text-h3` → `--text-h4`
- Eliminados `@keyframes navWipeIn` y `.is-nav-animating` del CSS

#### Contact — layout y timing
- `phraseVisible = false` por defecto; `IntersectionObserver` (threshold 0.25) lo activa al entrar en viewport → scramble ocurre al scrollear a la sección, no al cargar la página
- Layout: `flex-direction: row; align-items: flex-start` → botón alineado al tope de la frase
- `text-align: center` en phrase wrapper → frase centrada horizontalmente
- Placeholder reducido: `grid-column: 8 / span 5`, `min-height: 20rem`
- `href`: `mailto:sofiacirioni07@gmail.com`

#### Ticker-tape — scroll-driven reveal
- Reemplazado GSAP time-based entrance por reveal driven por `scrollVelocity`
- Cada fila arranca con `clipPath` al 100% desde su extremo (dir 1 → `inset(0 100% 0 0)`, dir -1 → `inset(0 0 0 100%)`)
- Por frame: `revealProgress[i] += Math.abs(scrollVelocity) * 0.04 + 0.0015`
- Stagger natural: `revealProgress` inicializado en `-(i * 0.25)` por fila
- Al llegar a 1: `clipPath = ''`, ticker continúa movimiento normal
- `SPEED_MULTIPLIER`: 3 → 5

**Archivos modificados en sesión 3:**
- `services/scroll-reveal.service.ts`
- `about/about.ts`, `about/about.html`
- `projects/projects.ts`, `projects/projects.html`, `projects/projects.css`
- `contact/contact.ts`, `contact/contact.css`
- `ticker-tape/ticker-tape.ts`

---

## Próximos pasos probables

- [ ] QA completo según `docs/qa-testing-checklist.md` (grid overlay, animaciones, WCAG contrast, responsive)
- [ ] Responsive: revisar breakpoints 1024px y 640px en todos los componentes
- [ ] Placeholders ASCII en Projects intro, Contact y Footer (actualmente vacíos en diseño)
- [ ] Deploy / build de producción

---

## Reglas para Claude

1. Leer el componente completo antes de proponer cambios
2. Nunca acceder a carpetas fuera del proyecto (`../`)
3. Nunca sugerir Tailwind utilities, Angular Material, ni otras librerías visuales
4. Siempre usar tokens CSS del `:root` — nunca hardcodear colores o font-sizes
5. DOM access exclusivamente con `@ViewChild`, nunca `document.querySelector`
6. GSAP siempre dentro de `NgZone.runOutsideAngular()`
7. Cleanup obligatorio en `ngOnDestroy`
8. Responder en español
