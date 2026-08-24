---
name: Ranking en Home Feed
overview: Clasificación de compañeros en el Feed con puntuación y métricas de tareas, calculadas en Postgres vía RPC.
status: completed
date: 2026-08-21
todos:
  - id: rpc-leaderboard
    content: Migración get_home_leaderboard (reputation + agregados de tareas)
    status: completed
  - id: api-ui
    content: API tipada, componente HomeLeaderboard e integración en Feed
    status: completed
  - id: tests-docs
    content: Tests unitarios y docs PRODUCT
    status: completed
---

# 17 — Ranking en Home Feed

## Objetivo

Mostrar en **Home → Feed** una clasificación clara por usuario: nombre, puntuación total (`reputation_points`) e info de tareas (pendientes, entregadas, completadas, vencidas).

## Enfoque

- RPC `get_home_leaderboard(p_home_id)` (security definer, solo miembros).
- Un round-trip: joins a `home_members` / `profiles` + agregados de `tasks`.
- Orden: reputación → puntos de tareas completadas → nº completadas → nombre.
- UI: tarjeta al estilo HealthMeter / BalanceSummary, resaltando al usuario actual.
