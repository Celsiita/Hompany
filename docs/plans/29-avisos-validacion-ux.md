---
name: Feed avisos, validación con motivo, UX tableros y agenda
overview: Bajar el volumen de Mico; terminar info del piso; avisos/quejas/reglas en Feed; motivo al impugnar/validar; ajustes de prueba; botón +; sin reabrir ni log de repetir; avisos de calendario en Agenda. Tutorial Mico después.
status: completed
date: 2026-09-06
todos:
  - id: mico-tone
    content: Emojis en vez de cara dibujada; Completar/Aprobar labels normales; Mico secundario
    status: completed
  - id: review-notes
    content: Comentario al aprobar/impugnar + banner Requiere revisión
    status: completed
  - id: proof-settings
    content: Ajustes piso prueba opcional/obligatoria y cámara vs galería
    status: completed
  - id: plus-no-reopen
    content: Botón + crear; quitar ⋮ crear; sin reabrir; sin log de repetir
    status: completed
  - id: feed-notices
    content: Reglas y quejas (anon opcional) en Feed
    status: completed
  - id: agenda-notices
    content: Visitas/reparaciones/eventos en calendario Agenda
    status: completed
  - id: tutorial-later
    content: Tutorial Mico 1ª apertura + Ajustes (después de lo anterior)
    status: completed
---

# Plan 29 — Avisos, validación y UX

## Mico
- Personaje **secundario**: no reescribir todos los CTAs.
- Feed limpio: sin cara dibujada ni «Mico dice».
- Tutorial con Mico: plan 30 (1ª apertura + repetir en Ajustes).

## Info del piso
- Ya en Feed (plan 28). Mantener.

## Feed — comunicación del piso
- **Reglas del piso** (posts `RULE`).
- **Quejas / avisos** puntuales (`COMPLAINT`), opción **anónima** (no mostrar autor en UI).
- UI en Feed + crear desde la tarjeta.

## Validación de tareas
- Al **impugnar**: comentario obligatorio → banner *Requiere revisión: …* hasta nueva entrega.
- Al **aprobar**: comentario/sugerencia opcional.
- Persistido en `task_reviews.comment` + eco en `tasks.review_note`.

## Prueba (foto)
- Ajustes del piso: **opcional / obligatoria**.
- Fuente: **cámara o galería** (default) vs **solo cámara** (pruebas más fiables).

## Tableros
- **+** visible para Nueva tarea / Nuevo gasto; quitar ⋮ de crear.
- **No reabrir** tarea ni gasto.
- **Repetir** no escribe actividad `TASK_REPEAT` / `EXPENSE_REPEAT`.

## Agenda
- Avisos `VISIT` | `REPAIR` | `EVENT` con rango de fechas; marcadores tipo ausencias/silencio.

## Después
- Tutorial onboarding → [plan 30](./30-tutorial-mico.md).
