# Periodicidad (tareas y gastos)

Contrato del motor en [`src/lib/recurrence.ts`](../src/lib/recurrence.ts) y del resumen de fechas en [`src/features/tasks/lib/countdown.ts`](../src/features/tasks/lib/countdown.ts).

## Modelo

| Campo | Valores |
|-------|---------|
| `recurrence` | `ONCE` \| `DAILY` \| `WEEKLY` \| `MONTHLY` |
| `due_mode` | `DEADLINE` (fecha límite) \| `EXECUTION` (día de ejecución) |
| `due_at` | Instantánea ISO del vencimiento / ejecución |
| `completed_at` | Instantánea de realización (tarea cerrada / gasto saldado) |
| `recurrence_config.*` | Día semana (obligatorio si WEEKLY), día mes / último día, pausa. `active_months` sigue en schema por compatibilidad pero ya no se edita en UI. |

### Tipos de fecha (`due_mode`)

| Modo | Significado | Hora / default en formularios |
|------|-------------|-------------------------------|
| **DEADLINE** | Momento máximo para completar o pagar | Hoy a las 23:59 local |
| **EXECUTION** | Día exacto programado para hacerlo | **Mañana** a las 09:00 local |

En formularios (`DueDateFields`) el usuario elige el modo y la fecha/hora (editable a mano o con −h/+h/−15/+15). En **periódicas**, el calendario fija el **primer vencimiento** y se sincroniza con el día de la semana / día del mes.

## Comportamiento ONCE vs recurrente

| | Una vez | Diario / Semanal / Mensual |
|--|---------|----------------------------|
| Al completar / saldar | Sale de **En curso** → solo **Historial**. No se genera siguiente. | La instancia cerrada va a Historial; se **spawnea** una nueva abierta con el siguiente `due_at`. |
| Cuenta atrás en activo | Hasta su único `due_at`. | Hasta el `due_at` de la instancia abierta (próximo vencimiento). |
| Historial | Muestra **Programada** (`due_at`) + **Realización** (`completed_at`). | Igual por cada ciclo cerrado. |

## Primer vencimiento (`computeInitialDueAt` / `computeCurrentPeriodDueAt`)

1. Se calcula el día del **periodo en curso** (hoy / este weekday / este mes).
2. Criterio “¿ya pasó?”: **día de calendario local**, no “saltar al mes siguiente” si el día configurado es hoy o futuro.
3. Si el día de este periodo ya pasó → `computeNextOccurrence` (avanza ≥1 periodo).
4. Se aplica `applyDueModeToDate` (23:59 o 09:00).

Ejemplo: 18 de agosto, mensual día 30 → **30 de agosto**. Semanal “miércoles” creado un miércoles → **hoy**, no la semana siguiente.

## Siguiente instancia (`computeNextOccurrence`)

Al cerrar una instancia recurrente: parte de `lastDueAt`, avanza un periodo, respeta `active_months` y `due_mode`. No spawnea si está en pausa, es `ONCE` o ya hay otra abierta.

## Cuenta atrás (sin desfase)

`formatDueSummary` combina:

- Fecha/hora absoluta local.
- Días de calendario (`calendarDaysBetween`) → `hoy`, `mañana`, `en N días`, `hace N días`.
- Si es el mismo día y aún no vence: también `quedan Xh Ym`.

Así se evita el efecto “quedan 2d 23h” cuando el usuario espera “en 3 días”.

## Persistencia

Migración `20260820150000_due_mode_completed_at.sql`:

- `tasks.due_mode`, `tasks.completed_at`
- `expenses.due_mode`, `expenses.completed_at`
- `task_templates.due_mode`
- Backfill de `completed_at` desde `updated_at` en filas ya cerradas.

APIs: `updateTaskStatus` / `setExpenseStatus` escriben o limpian `completed_at` al completar/reabrir.

## UI

- Formularios: `RecurrenceEditor` + `DueDateFields` + `DateTimePickerModal`.
- Periódicas: etiqueta **Primer vencimiento** (fecha límite) o **Primer día de ejecución** (fecha de ejecución); sin banner de “este periodo…”.
- Semanal/mensual: día obligatorio; calendario solo habilita días válidos; sync bidireccional.
- Pausa indefinida disponible; no hay selector de meses activos en UI.
- Tarjetas activas: `formatDueSummary` (se conserva bajo la fecha).
- Historial: Programada + Realización.
- Tests: [`__tests__/features/task-recurrence.test.ts`](../__tests__/features/task-recurrence.test.ts), [`__tests__/lib/status-icons-time.test.ts`](../__tests__/lib/status-icons-time.test.ts).
