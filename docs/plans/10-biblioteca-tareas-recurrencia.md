---
name: Biblioteca de tareas y recurrencia
overview: "Las tareas se reutilizan desde Guardadas. Una vez siempre se archivan ahí; diarias y semanales se regeneran solas hasta darlas de baja."
status: completed
date: 2026-08-17
todos:
  - id: schema
    content: Tablas task_templates / assignees y template_id en tasks
  - id: spawn
    content: Spawn automático DAILY/WEEKLY y dar de baja
  - id: library
    content: Sección Guardadas con los mismos filtros
  - id: tests
    content: Tests de recurrencia, filtros de biblioteca y tsc
---

# Plan 10 — Biblioteca de tareas y recurrencia

## Problema

`recurrence` (ONCE / DAILY / WEEKLY) y `is_template` existen en `tasks` pero no cambian el comportamiento: cada fila es una instancia de un solo uso.

## Modelo

- **Plantilla** (`task_templates`): definición reutilizable (título, zona, puntos, asignados, periodicidad).
- **Instancia** (`tasks.template_id`): lo que aparece en En curso / Historial con `due_at` y estado.

| Periodicidad | En Guardadas | En el tablero |
|---|---|---|
| Una vez | Siempre, desde que se crea | Solo mientras hay una instancia abierta |
| Diaria / semanal activa | No | Se crea sola la siguiente al cerrar la actual |
| Diaria / semanal dada de baja | Sí | Deja de regenerarse |

## Acciones

- **Usar de nuevo** (Guardadas): crea una instancia. Si es diaria/semanal, la reactiva.
- **Dar de baja** (tablero, solo DAILY/WEEKLY): `is_active = false`, omite la instancia abierta, la plantilla pasa a Guardadas.
- Al completar una diaria/semanal activa: se programa la siguiente (`due_at` +1 día o +7 días). Al refrescar, se cubren huecos si faltaba instancia.

## UI

Tareas: **En curso | Guardadas | Historial**, con los filtros Mis tareas / Compañeros y Todas / Zonas / Rápidas.
