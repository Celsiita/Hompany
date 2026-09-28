---
name: Ventana temporal, recurrencia por intervalo y agenda
overview: Sustituye due_mode excluyente por starts_at+due_at+all_day, recurrencia interval+unidad (incl. YEARLY), agenda anclada a dueDate con badges disponible/bloqueada/atrasada, drag-down BottomSheet y listas compartidas fuera de la UI.
status: in_progress
date: 2026-09-05
todos:
  - id: bottomsheet-lists
    content: Drag-down BottomSheet + quitar listas compartidas de Expenses
    status: completed
  - id: migration
    content: Migración starts_at/all_day/YEARLY
    status: completed
  - id: forms-lib
    content: DueDateFields, RecurrenceEditor, schemas, APIs
    status: completed
  - id: agenda
    content: Agenda por dueDate + badges de ventana
    status: completed
  - id: verify
    content: Tests + db push
    status: pending
---

# Plan 26 — Ventana temporal y recurrencia por intervalo

## Bottom Sheet
- Dismiss: Cancelar, backdrop, Android back, **arrastre hacia abajo**.
- Handle: siempre dismiss al arrastrar abajo.
- Cuerpo: solo si `scrollOffset <= 0` y el gesto sigue hacia abajo.

## Modelo
- `starts_at`, `due_at`, `all_day` en tasks / expenses / templates.
- `recurrence_config.interval` + kinds `DAILY|WEEKLY|MONTHLY|YEARLY`.
- Agenda: un ítem por día de **due**; badges por `scheduleAvailability`.
