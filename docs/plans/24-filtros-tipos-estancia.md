---
name: Filtros, tipos personalizados y Estancia en menú
overview: "Ajuste de filtros Home/Tareas/Gastos, eliminación de Zonas, tipos personalizados, estados alineados, Estancia en el menú Home."
status: completed
date: 2026-09-03
todos:
  - id: home-scope
    content: Mis cosas / Compañeros; sin tip; vacío = Todo el piso
    status: completed
  - id: expense-labels
    content: Mis deudas / Mis cobros
    status: completed
  - id: custom-types
    content: home_item_types + quitar Zonas; solo Tareas rápidas + custom
    status: completed
  - id: status-filters
    content: Quitar Ver pausadas; chips de estado alineados
    status: completed
  - id: stay-menu
    content: Estancia + leave al menú ⋮ Home
    status: completed
  - id: docs
    content: PRODUCT, ARCHITECTURE, notifications, plan 23
    status: completed
---

# Plan 24 — Filtros, tipos y Estancia

## Home Agenda

- Alcance: `Mis cosas` | `Compañeros` (sin InfoTip). Sin selección = Todo el piso.
- Estancia + ausencia de sistema salen de Agenda → menú ⋮.

## Tareas

- Sin categoría Zonas (migración a QUICK). Filtro de tipo: Tareas rápidas + `home_item_types`.
- Sin menú «Ver pausadas y archivadas»; chip Pausada en filtros.
- Estados en curso / historial alineados con la máquina de estados (+ PAUSED UI).

## Gastos

- Labels: Mis deudas / Mis cobros.
- Tipos builtin + personalizados.
- Estados: Pendiente / Pausado; historial Saldado / Omitido / Archivado.
