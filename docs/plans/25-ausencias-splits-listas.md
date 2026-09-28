---
name: Ausencias unificadas, splits y listas
overview: "Quitar estancias; ausencias con 2 tipos; splits EQUAL/PERCENT/AMOUNT; invite link/QR; listas compartidas de compra; filtros Atrasado."
status: completed
date: 2026-09-04
todos:
  - id: sheet-filters-copy
    content: Sheet swipe anywhere, filtros Atrasado, texto Dividir
    status: completed
  - id: absences-unify
    content: Quitar estancias; Ausencias = puntual + sistema
    status: completed
  - id: split-modes
    content: Modos Igualitario / Porcentajes / Cantidades fijas
    status: completed
  - id: invite-qr
    content: Enlace + QR en Ajustes por piso
    status: completed
  - id: shopping-lists
    content: Listas compartidas + aviso falta + rotación
    status: completed
  - id: docs-tests
    content: Docs + tests
    status: completed
---

# Plan 25 — Ausencias, splits, invite y listas

## UX rápida
- Bottom sheet: swipe up en cualquier parte del sheet
- Filtros: sin Vencida en tareas; Tarde→Atrasado; gastos Atrasado (due_at pasado)
- Texto bajo «Dividir entre todos»

## Ausencias
- Eliminar Estancia / presence periods de UI y freeze
- Panel **Ausencias** con tipos: Puntual | Indefinida/planificada
- Quitar del menú ⋮

## Splits
- `expenses.split_mode`: EQUAL | PERCENT | AMOUNT
- `expense_shares.share_percent` opcional
- UI selector encima de deudores

## Invite
- Enlace `hompany://join?code=` + QR en Ajustes (piso activo)

## Listas
- `home_shopping_lists` + items; aviso si falta algo; rotación opcional del comprador
