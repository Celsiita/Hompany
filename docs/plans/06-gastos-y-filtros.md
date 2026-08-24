---
name: Gastos y filtros de tareas
overview: "Paso 6: Mis tareas vs Compañeros, categorías sin supermercado, pestaña Gastos (súper, casa, deudas) y saldos quién-debe-a-quién."
status: completed
date: 2026-08-17
todos:
  - id: filters
    content: Reescribir alcance Mis tareas / Compañeros y chips Todas / Zonas / Rápidas
  - id: gastos
    content: Schema, API y UI de Gastos con saldos
  - id: verify
    content: Tests y tsc
---

# Plan: Gastos y filtros de tareas (Paso 6)

## Tareas

- Primer filtro: **Mis tareas** | **Compañeros**
  - Mías: abiertas mías + feed = mis entregas en revisión (sin validar a otros)
  - Compañeros: solo las de otras personas + feed = fotos a validar
- Segundo filtro: Todas / Zonas / Tareas rápidas (aplica a abiertas y al feed)
- Supermercado sale del tablero de limpieza

## Gastos (nueva pestaña)

- GROCERY / HOUSE / PEER
- Reparto entre compañeros y resumen «quién debe a quién»
- Semilla al crear/unirse a piso

## Extras incluidas

- Saldos simplificados (quién le debe a quién, no una lista cruda)
- Importe 0 en súper/casa = recordatorio sin afectar deudas
- Mini-saldos en Home
