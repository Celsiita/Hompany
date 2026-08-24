---
name: Fechas, periodicidad y calendario
overview: Corrige el selector de hora, sincroniza calendario con reglas semanal/mensual, limpia meses activos y etiquetas de primer vencimiento.
status: completed
date: 2026-08-21
todos:
  - id: time-picker
    content: Arreglar edición HH:mm y botones +/- sin pisar la hora al confirmar
    status: completed
  - id: calendar-sync
    content: Sync bidireccional día semana/mes ↔ calendario; restricciones de celdas
    status: completed
  - id: ui-cleanup
    content: Quitar banner primer vencimiento y meses activos; etiqueta primer vencimiento
    status: completed
  - id: tests-docs
    content: Tests de sync/calendar y docs recurrence
    status: completed
---

# 18 — Fechas, periodicidad y calendario

## Cambios

- `DateTimePickerModal`: sanitiza teclado, dismiss al usar steppers, conserva hora al confirmar.
- `DueDateFields`: etiqueta «Primer vencimiento / Primer día de ejecución» en periódicas; preview countdown intacto.
- Semanal/mensual: día obligatorio; calendario restringido; sync al tocar fecha o chips.
- Eliminado banner «Primer vencimiento: … este periodo…» y UI de «Meses activos».
- Pausa indefinida sin cambios.
