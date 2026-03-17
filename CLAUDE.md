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
| `services/scroll-reveal.service.ts` | ✅ Completo | GSAP + IntersectionObserver, opacity 0→1 + translateY 24→0, cleanup retornado |
| `nav/` | ✅ Completo | Underline serif italic on hover, `::before` reserva ancho |
| `hero/` | ✅ Completo | ASCII 85f@30fps (welcome) → 608f@10fps (nubes loop), scramble phrase, ResizeObserver scale |
| `scramble-phrase/` | ✅ Completo | Reutilizable, `lines: ScrambleWordDef[][]`, idle scramble, `complete` EventEmitter |
| `pill-btn/` | ✅ Completo | CTA reutilizable, hover `--color-primary`, active `--color-accent` |
| `ticker-tape/` | ✅ Completo | Scroll-velocity driven, 4 copias, IntersectionObserver, pause off-screen |
| `about/` | ✅ Completo | Subgrid exp+lang, skill cards con CSS mask, full-bleed `--color-base-accent` |
| `projects/` | ✅ Completo | Acordeón, clip-path wipe transition, grid 5 cols en detail view |
| `contact/` | ✅ Completo | 2 frases alternantes cada 10s via `@if` destroy/recreate, email CTA |
| `footer/` | ✅ Completo | Social links, tagline IBM Plex Serif italic, go-top |

---

## Historial de sesiones

### Sesión anterior — 2026-03-16 (id: 1d3920bc-0c17-4c27-ae8e-2a46816fea77)

**Rama:** `feature/contact-section` → mergeada a `develop`

**Trabajo realizado:**
- Implementación de `contact/` — dos frases scramble alternantes (`Want to work together?` / `Let's get in touch`), ciclo de 10s con fade-out de 0.45s antes del swap, email CTA con `PillBtnComponent`
- Implementación de `footer/` — social links (col 2–4), tagline serif italic (col 5–9), go-top + credits (col 10–12)
- Limpieza de dependencias no usadas (`skills.md` documentado)
- Creación de `.claudeignore`
- Setup de workflow de revisión con Gemini

**Commits clave:**
```
dda24eb Merge branch 'feature/contact-section' into develop
1bde240 added: contact and footer.
0ccfd7b added: skills.md - done: unused dependency cleaning
```

---

### Sesión actual — 2026-03-17

**Rama:** `develop`

**Trabajo realizado:**
- Creado `src/app/services/scroll-reveal.service.ts` — servicio compartido `providedIn: 'root'` que expone `reveal(el: HTMLElement): () => void`
  - Aplica estado inicial via `gsap.set(el, { opacity: 0, y: 24 })`
  - Usa `IntersectionObserver` (threshold 0.12) para disparar `gsap.to()` al entrar en viewport
  - Todo corre dentro de `NgZone.runOutsideAngular()` — sin costo de change detection
  - Retorna función de cleanup (disconnect + tween.kill)
- Aplicado scroll reveal en: `about.ts`, `projects.ts`, `contact.ts`, `footer.ts`
  - Cada uno: `@ViewChild('sectionEl')`, `AfterViewInit`, `OnDestroy`, cleanup en `ngOnDestroy`
  - Ref `#sectionEl` agregada al root element de cada template HTML
- Verificado con Playwright headless:
  - About: opacity 0 antes del scroll → 1 después, transform `matrix(1,0,0,1,0,24)` → `matrix(1,0,0,1,0,0)`
  - Projects, Contact, Footer: opacity 1 después de scroll ✅

**Archivos nuevos/modificados:**
- `src/app/services/scroll-reveal.service.ts` (nuevo)
- `about/about.ts`, `about/about.html`
- `projects/projects.ts`, `projects/projects.html`
- `contact/contact.ts`, `contact/contact.html`
- `footer/footer.ts`, `footer/footer.html`

**Ajustes posteriores (misma sesión):**
- `scroll-reveal.service.ts` — animación bidireccional + repeatable:
  - Estado inicial: solo `opacity: 0` (sin `y`) para no inflar scrollHeight
  - IntersectionObserver permanente (sin `disconnect` al entrar)
  - En enter: `boundingClientRect.top >= 0` → `y: 48` (desde abajo), else `y: -48` (desde arriba), luego `gsap.to({ opacity: 1, y: 0 })`
  - En exit: `boundingClientRect.bottom <= 0` → reset `y: -48`, else `y: 48`
  - Cleanup: `clearProps: 'opacity,transform'`
- `styles.css` — doble scrollbar corregido:
  - `overflow-x: hidden` → `overflow-x: clip` en `html` y `body`
  - `clip` no crea scroll container → `overflow-y` permanece `visible` → UN solo scrollbar
- `footer.css` — margen derecho mínimo 27px:
  - `padding: 2.5rem 1rem 0` → `padding: 2.5rem 1.5rem 0 1rem`
  - Left: 1rem (alineado con page-wrapper) · Right: 1.5rem (27px)

**Verificado con Playwright:**
- `html.overflowY: visible`, `body.overflowY: visible`, `scrollContainers: []` — cero scrollbars extras ✅
- Bidireccional: opacity 1 → 0 (al subir) → 1 (al volver a bajar) ✅
- Footer area post-animación: `4173 vs 4170` (3px residual, vs 48px anterior) ✅

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
