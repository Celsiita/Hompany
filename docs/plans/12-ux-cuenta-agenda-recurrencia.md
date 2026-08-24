---
name: UX cuenta, agenda y recurrencia del periodo
overview: "Ojo de contraseña, borrar/abandonar piso, menús ⋮, filtros sin Todos, vencimiento del periodo actual, salud visual, agenda, date picker, confirmaciones y docs de recurrencia/notificaciones."
status: completed
date: 2026-08-18
todos:
  - id: settings-account
    content: Contraseña, cuenta, compañeros, copiar código, confirmaciones
    status: completed
  - id: filters-recurrence
    content: Chips toggle, periodo actual, date picker, countdown
    status: completed
  - id: home-ui
    content: Salud, métricas, agenda, menús ⋮, nombres, scroll, títulos
    status: completed
  - id: docs
    content: Producto, recurrencia, notificaciones, iconos
    status: completed
  - id: tests
    content: tsc y suite
    status: completed
---

# Plan 12

Correcciones de UX sobre Tareas, Gastos, Home y Ajustes, más documentación de periodicidad y avisos.

- Login/registro: toggle de visibilidad de contraseña.
- Ajustes: copiar código, menú ⋮ de compañeros (admin / expulsar / actividad), abandonar piso, borrar cuenta, iconos, confirmaciones.
- Filtros sin «Todos»; segunda pulsación limpia el filtro (categoría, periodo, Mis tareas/Compañeros, Lo que debo/Me deben).
- Recurrencia: primer vencimiento en el periodo en curso; `ONCE` con calendario fecha+hora en tareas y gastos.
- Home: medidor de salud, barra de métricas, agenda 7 días, avisos (vence, overdue, foto, gasto nuevo, deuda saldada).
- Docs: `docs/PRODUCT.md`, `docs/recurrence.md`, `docs/notifications.md`.
- Migración: `supabase/migrations/20260818230000_account_home_lifecycle.sql` (`leave_home`, `kick_home_member`, `delete_own_account`).
