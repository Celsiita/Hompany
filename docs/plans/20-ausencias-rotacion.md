---
name: Ausencias y rotación de tareas
overview: Registro de ausencias por miembro en Agenda, exclusión en rotación automática, validación en asignación manual y omisión automática cuando todos están ausentes.
status: completed
date: 2026-08-28
todos:
  - id: db-absences
    content: Tabla member_absences + RLS
    status: completed
  - id: rotation-engine
    content: pickNextAvailableAssignee + skip fechas sin disponibles
    status: completed
  - id: agenda-ui
    content: AbsencesPanel en Agenda + indicador calendario
    status: completed
  - id: manual-guards
    content: Bloqueo UI/API asignación a ausentes
    status: completed
  - id: tests-docs
    content: Tests unitarios y documentación
    status: completed
---

# Plan 20 — Ausencias y rotación

## Objetivo

Permitir que cada compañero registre periodos de ausencia desde **Agenda** y que el motor de **adjudicación automática** los excluya sin acumular deuda al volver.

## Modelo de datos

Tabla `member_absences`:

| Campo | Tipo | Notas |
|-------|------|-------|
| `home_id` | uuid | Multi-tenant obligatorio |
| `user_id` | uuid | Solo el propio usuario crea (admin puede editar/borrar) |
| `start_date` | date | Inclusive |
| `end_date` | date | Inclusive |
| `reason` | text? | Opcional |

RLS: lectura para miembros del piso; escritura propia (+ admin).

## Motor de rotación

1. `filterAvailableMemberIds` elimina ausentes del pool en la fecha de vencimiento.
2. `pickNextAvailableAssignee` aplica round-robin solo sobre disponibles.
3. Ausente **no** avanza el cursor de rotación: al volver entra en el ciclo normal sin tareas atrasadas.
4. Si **todos** los del pool están ausentes: la fecha se añade a `skipped_dates` y se calcula la siguiente ocurrencia (hasta 52 intentos).

## UI

- **Agenda → Ausencias**: registrar, listar (propias + compañeros), eliminar las propias.
- **Calendario**: punto violeta en días con alguna ausencia.
- **TaskFormModal** y **ScheduledItemSheet**: bloqueo + mensaje `⚠️ [Nombre] estará ausente en esta fecha`.
- API `assertAssigneesAvailableForDate` / `reassignTaskOccurrence` validan en servidor.

## Archivos clave

- `supabase/migrations/20260828140000_member_absences.sql`
- `src/lib/absences.ts`
- `src/features/home/api/absences-api.ts`
- `src/features/home/hooks/useHomeAbsences.ts`
- `src/features/home/components/AbsencesPanel.tsx`
- `src/features/tasks/api/tasks-api.ts` (`insertTaskInstance`, `resolveAssigneeIds`)
