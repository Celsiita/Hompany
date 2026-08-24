---
name: Recurrencia avanzada, historial e intercambios
overview: "Quita Guardadas, unifica recurrencia flexible en tareas y gastos, añade intercambios, adjudicación automática, historial con repetir/reabrir y roles de admin."
status: completed
date: 2026-08-17
todos:
  - id: schema
    content: Enums, recurrence_config, swaps, activity, RLS admin
  - id: recurrence
    content: Motor WEEKLY/MONTHLY, pausa, meses activos, títulos de ciclo
  - id: swaps
    content: Solicitud de intercambio y auto-assign
  - id: ui
    content: Solo En curso/Historial, Ocio, filtros, fechas, roles
  - id: tests
    content: tsc y suite de tests
---

# Plan 11

- Navegación Tareas/Gastos: **En curso | Historial** (sin Guardadas ni Dar de baja).
- Recurrencia ONCE/DAILY/WEEKLY/MONTHLY + `recurrence_config` (día, último día, meses, pausa).
- Historial: fecha, badges, **Repetir** (nueva instancia) y **Reabrir** (mismo registro). Los movimientos de admin y reopen/repeat quedan en `home_activity_events`.
- Gastos PEER se muestra como **Ocio**.
- Intercambio de tareas (aceptar/rechazar) y `auto_assign` opcional.
- Roles: `owner`/`admin` vs `member`. RLS: solo admin borra o edita lo que no es suyo.
