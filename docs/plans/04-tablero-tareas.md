---
name: Tablero de tareas
overview: "Paso 4: tablero de tareas real filtrado por activeHomeId — listar, crear, countdown, transiciones básicas de estado (PENDING→SUBMITTED→COMPLETED) y resumen en el feed Home."
status: completed
date: 2026-08-16
todos:
  - id: tasks-api
    content: API listar/crear/actualizar estado con home_id
    status: completed
  - id: tasks-ui
    content: UI Tablero cards, countdown, crear tarea
    status: completed
  - id: home-summary
    content: Resumen de tareas en Home feed
    status: completed
  - id: tests-docs
    content: Tests + docs/índice de planes
    status: completed
---

# Plan: Tablero de tareas (Paso 4)

## Objetivo

Sustituir el placeholder del tablero por datos reales de Supabase, siempre filtrados por el `home_id` activo.

## Alcance

**Incluye:**

- Listar tareas del piso activo (orden por `due_at`)
- Crear tarea (título, descripción opcional, vencimiento)
- Cards con estado, puntos y countdown
- Transiciones: `PENDING → SUBMITTED`, `SUBMITTED → COMPLETED`
- Resumen de cumplimiento en Home
- Historial básico (tareas cerradas)
- Tests de countdown, resumen y validación de transiciones

**Fuera de alcance (Paso 5+):**

- Foto de prueba (Storage) al entregar
- Impugnar / emojis de revisión
- Asignación semanal automática
- Realtime

## Flujo

```mermaid
flowchart LR
  HomeProvider[activeHomeId] --> TasksAPI[listTasksByHome]
  TasksAPI --> Board[Tablero cards]
  Board --> Create[Crear PENDING]
  Board --> Submit[PENDING a SUBMITTED]
  Board --> Approve[SUBMITTED a COMPLETED]
```

## Criterios de éxito

- Ana/Bruno ven las 3 tareas seed en Tareas
- Crear tarea aparece en el tablero del mismo `home_id`
- Countdown visible en PENDING
- Home muestra conteos por estado
- `npm test` en verde
