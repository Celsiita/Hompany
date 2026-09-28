---
name: Calendario de exámenes y modo silencio
overview: Periodos de exámenes por usuario en Agenda, franjas visuales en calendario y aviso de modo silencio antes de quejas directas.
status: completed
date: 2026-08-28
todos:
  - id: db-exam-periods
    content: Tabla member_exam_periods + RLS
    status: completed
  - id: agenda-ui
    content: ExamPeriodsPanel + franjas en calendario
    status: completed
  - id: silence-mode
    content: Aviso al impugnar + documentación notificaciones
    status: completed
  - id: tests-docs
    content: Tests y documentación plan 21
    status: completed
---

# Plan 21 — Calendario de exámenes / Modo silencio

## Objetivo

Registrar periodos de estudio intenso sin alterar la rotación de tareas. El piso ve las fechas en el calendario común y recibe un aviso empático antes de quejas directas.

## Modelo

Tabla `member_exam_periods`: `home_id`, `user_id`, `start_date`, `end_date`, `label`.

## Diferencia con ausencias

| | Ausencias | Exámenes |
|--|-----------|----------|
| Rotación | Excluye del turno | **Sigue asignando** |
| Calendario | Punto violeta | Franja celeste + `📚 Exámenes: [Label]` |
| Efecto social | — | Modo silencio (aviso antes de queja/notificación) |

## UI

- **Agenda → Calendario de exámenes**: registrar periodos propios.
- **MonthCalendar**: bandas sombreadas sobre el mes + celdas `bg-sky-100` + 📚.
- **WeekAgenda / DayAgendaSheet**: etiqueta del periodo en días afectados.
- **TasksScreen**: al **Impugnar**, confirmación con `examSilenceWarning` si el asignado está en exámenes.

## Archivos

- `supabase/migrations/20260828150000_member_exam_periods.sql`
- `src/lib/exam-periods.ts`
- `src/features/home/components/ExamPeriodsPanel.tsx`
- `src/features/home/components/ExamCalendarBands.tsx`
- `docs/notifications.md` (contrato futuro push/direct messages)
