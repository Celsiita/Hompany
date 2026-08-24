---
name: Tablero de tareas avanzado
overview: "Paso 5: categorías y semillas al crear piso, filtros UI, multi-asignación, foto con expo-image-picker + Storage, feed de revisiones y CRUD modal."
status: completed
date: 2026-08-16
---

# Plan: Tablero de tareas avanzado (Paso 5)

## Alcance

- Categorías: ZONE / QUICK / GROCERY + iconos
- Seed automático al crear/unirse a piso (`seed_default_home_tasks`)
- Filtros: Todas | Zonas | Rápidas | Supermercado + Mis tareas | Casa
- Cards con acción foto, CRUD modal, feed de revisiones
- Storage bucket `task-proofs` + `expo-image-picker` / manipulator

## Entregado

- Migración `20260817010000_tasks_advanced.sql`
- API: CRUD, assignees, proof upload, reviews
- UI: `TaskFilterBar`, `TaskCard`, `TaskFormModal`, `ProofSourceModal`, `TasksScreen`
- Tests de filtros de tablero y esquemas de categoría

## Fuera de alcance inmediato

- Periodicidad automática (campo guardado; cron no)
- Notificaciones push
