---
name: Mascota Mico (mono del piso)
overview: Introduce Mico, la mascota mono de HOMPANY, ambientando Home, empty states, revisiones, vergüenza y recompensas por fases.
status: in_progress
date: 2026-09-05
todos:
  - id: docs-identity
    content: Documentar identidad, tono y roadmap en plan + PRODUCT.md
    status: completed
  - id: mood-home
    content: Estados emocionales en Feed (salud del piso) + lib/copy
    status: completed
  - id: empty-copy
    content: Empty states con voz de Mico (tareas, gastos, agenda)
    status: completed
  - id: review-reactions
    content: Reacciones al aprobar/impugnar fotos + botones con voz de Mico
    status: completed
  - id: personality-ui
    content: Cara dibujada + bocadillo (no solo emoji) en Feed, vacíos y subtítulos
    status: completed
  - id: shame-skin
    content: Variante vergüenza ligada a faltas (avatar/badge)
    status: pending
  - id: loading-alerts
    content: Loading Mico + avisos narrados por Mico
    status: completed
  - id: extras
    content: Stickers, skins, rachas, onboarding (fases posteriores)
    status: pending
---

# Plan 27 — Mascota Mico

## Identidad

| Campo | Valor |
|-------|--------|
| Nombre | **Mico** |
| Especie | Mono (mascota del piso, no de un miembro) |
| Tono | Cotilla simpático, juez ligero, nunca cruel |
| Visual v1 | Emoji / tutorial; **sin** cara vectorial en Feed |
| Visual v2 | Ilustraciones / skins (gorra, delantal, auriculares exámenes) |

Mico es la **voz del tutorial** (y helpers de copy). El Feed y los tableros van neutrales.

## Personalidad en producto (ya)

- Feed: **sin** cara ni bocadillo (salud / ranking / info neutrales).
- Empty states: copy neutro (`MascotEmpty`).
- Tutorial onboarding: plan 30 (`TutorialHost` + Ajustes → Ver tutorial).
- Helpers de voz (`mascotQuip` / reacciones) reservados para fases posteriores.

## Estados emocionales

| Humor | Cuándo | Cara | Sensación |
|-------|--------|------|-----------|
| `thriving` | Salud **Excelente** | (legacy) | Orgulloso |
| `okay` | Salud **Regular** | (legacy) | Vigila |
| `chaos` | Salud **Crítico** | (legacy) | Caos |
| `shame` | ≥3 faltas (fase 2) | tapa | Vergüenza |
| `exam` | Modo silencio (fase 2) | guiño serio | Silencio |
| `guard` | Ausencias (fase 2) | neutro | Guardia |

`MascotFace` / `MascotSpeech` eliminados del producto (cara dibujada descartada).

## Roadmap restante

### Fase 2b — Vergüenza
1. Badge/avatar tras N faltas.
2. Avisos “Mico chiva” lo pendiente.

### Fase 3 — Ambiente y recompensas
1. Stickers en swaps / disputas.
2. Skins del mono del piso (ranking / rachas).
3. ~~Onboarding narrado por Mico~~ → plan 30.
4. Loading states (colgado del mango).

## Fuera de alcance aún
- Lottie / assets raster.
- Persistencia de skins en BD.
- Chat con la mascota.
