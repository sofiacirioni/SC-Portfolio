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
| `services/i18n.service.ts` | ✅ Completo | `lang` signal EN/ES (default EN), `toggle()`, persiste en localStorage + `<html lang>`. Copy colocado por componente (`computed` según `lang()`) |
| `nav/` | ✅ Completo | Labels traducibles (cols 4/7/10), toggle de idioma `EN/ES` en col 12, `line-height: 1.6` fijo (el hover serif ya no cambia la altura de la barra) |
| `hero/` | ✅ Completo | ASCII 85f@30fps (welcome) → 608f@10fps (nubes loop), scramble phrase, ResizeObserver scale |
| `scramble-phrase/` | ✅ Completo | Reutilizable, `lines: ScrambleWordDef[][]`, idle scramble, `complete` EventEmitter |
| `pill-btn/` | ✅ Completo | CTA reutilizable, hover `--color-primary`, active `--color-accent` |
| `ticker-tape/` | ✅ Completo | 3 filas (EN, mayúsculas). Drift base constante (`BASE_SPEED = 0.4`) + scroll lo intensifica (`SPEED_MULTIPLIER = 5`). Reveal scroll-driven por clip-path |
| `about/` | ✅ Completo | Reveal secuencial por bloques. Data + labels traducibles vía `computed` |
| `projects/` | ✅ Completo | Acordeón; **TEG = P-02** (preview video + galería + link a Yetem); video del detalle sin recuadro de color (aspect propio); base EN + overlay ES (`esOverrides`) |
| `contact/` | ✅ Completo | Frases scramble EN/ES (re-key por idioma), `fontSize` en `clamp()`; en mobile stack de 1 col (label → ASCII full-width → frase → botón) |
| `footer/` | ✅ Completo | Legal en grid 3-col (izq/centro/der), copy EN/ES, full-bleed con `margin-inline: -1rem` (no `100vw`, evita overflow por scrollbar) |

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

### Sesión 4 — 2026-08-14

**Rama:** `feature/hero-video-ascii` → mergeada (fast-forward) a `develop` y `main`

**Trabajo realizado:**

#### Proyecto TEG (nuevo, P-02)
- Reordenado: PreVisar (P-01), **TEG (P-02)**, Lab (P-03). Numeración correlativa
- Assets propios optimizados con ffmpeg (instalado `--no-save`, removido después):
  - Videos → `assets/video/`: `teg-preview.mp4` (main), `teg-crear-partida.mp4`, `teg-partida.mp4`, `teg-win.mp4` (H.264 crf 30, 1280px, sin audio)
  - Imágenes → `assets/images/projects/teg/`: `teg-logo.webp`, `teg-medal.webp` (PNG→WebP 480px), `teg-cursor-default.svg`, `teg-cursor-pointer.svg`
- Galería: 3 clips de funcionalidad + 1 tile que cicla los assets (logo, medalla, cursores)
- Link a `refUrl` "Original game by Yetem" (`yetem.com`)
- **Video del detalle sin recuadro de color**: `.pj-media` sin `aspect-ratio`/`background`, el `<video>` va a su relación propia (`height: auto`)

#### i18n — toggle de idioma EN/ES
- `services/i18n.service.ts`: `lang` signal (default EN), `toggle()`, persistencia localStorage + `<html lang>`
- Toggle `EN/ES` en la barra; copy colocado por componente (`computed` según `i18n.lang()`)
- Hero y frases de contacto se **re-crean** al cambiar idioma (`@for` keyed por `lang`) porque el scramble solo lee `lines` en `ngOnInit`
- Proyectos: base EN + overlay ES (`esOverrides`, merge por id)
- Ticker queda fijo en inglés (textura decorativa)

#### Copy
- Hero: "Head in the clouds, hands in the code" / ES "La cabeza en las nubes, las manos en el código" + subline nuevo
- Intro proyectos: "Each one started messy. / This is where it landed." (+ `line-height: 1.22` para no tapar el descender de la "y")
- Footer note: "Still have an idea up in the air? / Let's land it." (ES: "…Vamos a concretarla.")

#### Layout / responsive / márgenes
- **Fix márgenes**: `footer/.footer-inner` y `home/.boundary-tickers` pasaron de `width: 100vw` (incluía el scrollbar → overflow y margen derecho corrido) a `margin-inline: -1rem`
- Footer legal en grid 3-col (uno por lado + centro exacto)
- Hero mobile: `.hero-lower` apila frase + CTA (antes la frase quedaba a ~160px)
- Contact mobile: stack de 1 col, ASCII full-width, `fontSize` en `clamp()`
- Nav: `line-height: 1.6` fijo → el hover ya no cambia la altura de la barra

#### Ticker
- 3 filas (antes 2), inglés + mayúsculas unificadas
- Drift base constante (`BASE_SPEED = 0.4`) + el scroll lo intensifica

---

## Próximos pasos probables

- [ ] QA completo según `docs/qa-testing-checklist.md` (grid overlay, animaciones, WCAG contrast, responsive)
- [~] Responsive: hecho hero + contact + nav + márgenes; falta pasar el resto de componentes (about, projects, tickers) por mobile
- [ ] Traducir también las tools de proyectos que son nombres propios queda como está; revisar frases largas ES que apilen en mobile
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
