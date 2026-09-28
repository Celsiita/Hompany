---
name: Instancias programadas, cancelación y agenda
overview: Proyectar próximas ejecuciones en calendario/agenda, diferenciar Abierta vs Programada, cancelar/reasignar puntualmente y filtrar gastos solo para involucrados.
status: completed
date: 2026-08-27
todos:
  - id: schema-privacy
    content: expense_status SKIPPED + RLS gastos solo involucrados + spawn tras skip
    status: completed
  - id: projection
    content: Proyección de ocurrencias + AgendaItem open/scheduled + filtros
    status: completed
  - id: actions
    content: Cancelar esta fecha y reasignación puntual (tareas/gastos)
    status: completed
  - id: ui
    content: Filtros agenda, atenuado programadas, sheet, menú ⋮ en abiertas
    status: completed
  - id: tests-docs
    content: Tests y PRODUCT/recurrence/ARCHITECTURE
    status: completed
---

# 19 — Instancias programadas y gestión puntual

## Modelo

- **Abierta:** fila DB activa (`PENDING`/`SUBMITTED`/`OVERDUE` o gasto `OPEN`).
- **Programada:** proyección client-side desde la instancia abierta / serie (sin romper one-open-per-template).
- Excepciones en `recurrence_config`: `skipped_dates[]`, `assignee_overrides{}`.

## Cancelar esta fecha

- Abierta tarea → `SKIPPED` + spawn siguiente.
- Abierta gasto → `SKIPPED` + spawn siguiente (acreedor).
- Programada → añade fecha a `skipped_dates` (no altera plantilla ni siguientes).

## Privacidad gastos

RLS select solo si `paid_by` o share; admin no involucrado no ve el gasto.
