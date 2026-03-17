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

*Pendiente de registrar al finalizar la sesión.*

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
