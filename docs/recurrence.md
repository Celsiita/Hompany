# Periodicidad (tareas y gastos)

Contrato del motor en [`src/lib/recurrence.ts`](../src/lib/recurrence.ts) y del resumen de fechas en [`src/features/tasks/lib/countdown.ts`](../src/features/tasks/lib/countdown.ts).

## Modelo

| Campo | Valores |
|-------|---------|
| `starts_at` | Inicio / activación (cuándo se puede empezar) |
| `due_at` | Fecha límite (ancla en Agenda: solo ese día) |
| `all_day` | Si true, UI sin horas (00:00 → 23:59 local) |
| `recurrence` | `ONCE` \| `DAILY` \| `WEEKLY` \| `MONTHLY` \| `YEARLY` |
| `recurrence_config.interval` | Entero ≥ 1 (“cada N unidades”) |
| `recurrence_config.days_of_week` | Días ISO 1–7 si WEEKLY |
| `due_mode` | Legacy DB (`DEADLINE`/`EXECUTION`); formularios nuevos escriben `DEADLINE` |

### Ventana temporal (UI)

Orden en formularios (`ScheduleEditor`):

1. **Calendario** — un día o rango (primera ocurrencia).
2. **Horas** — todo el día, o hora de inicio (primer día) + hora de fin (último día).
3. **Periodicidad** — no se repite / se repite cada N días|semanas|meses|años.
   - Semanal: ≥1 día de la semana.
   - Mensual: ≥1 día del mes (o último día).
   - Anual: ≥1 mes + día del mes.
   - **Validación:** el rango de la primera ocurrencia no puede ser mayor que el periodo
     (p. ej. 2 días con “cada 1 día” es error). Diario/semanal se miden en días de calendario;
     mensual en meses; anual en años.

## Comportamiento ONCE vs recurrente

| | Una vez | Diario / Semanal / Mensual / Anual |
|--|---------|----------------------------|
| Al completar / saldar | Sale de **En curso** → solo **Historial**. No se genera siguiente. | La instancia cerrada va a Historial; se **spawnea** una nueva abierta con el siguiente `due_at` (y `starts_at` desplazado igual). |
| Cuenta atrás en activo | Hasta su único `due_at`. | Hasta el `due_at` de la instancia abierta (próximo vencimiento). |
| Historial | Muestra **Programada** (`due_at`) + **Realización** (`completed_at`). | Igual por cada ciclo cerrado. |
| Agenda | Solo el día de `due_at`. Badges: Disponible / Se desbloquea / Atrasada según `starts_at`–`due_at`. | Igual; proyecciones futuras también ancladas a su `due_at`. |

## Primer vencimiento (`computeInitialDueAt` / `computeCurrentPeriodDueAt`)

1. Se calcula el día del **periodo en curso** (hoy / weekdays / este mes / año).
2. Criterio “¿ya pasó?”: **día de calendario local**.
3. Si el día de este periodo ya pasó → `computeNextOccurrence` (avanza `interval` periodos).
4. Se aplica `applyDueModeToDate` (23:59 o 09:00) para la hora almacenada.

Ejemplo: 18 de agosto, mensual día 30 → **30 de agosto**. Semanal “miércoles” creado un miércoles → **hoy**, no la semana siguiente.

## Tipos de fecha legacy (`due_mode`)

| Modo | Significado | Hora / default |
|------|-------------|----------------|
| **DEADLINE** | Momento máximo | 23:59 local |
| **EXECUTION** | Punto programado | 09:00 local |

La UI prioriza `starts_at` + `due_at`; `due_mode` se mantiene en BD por compatibilidad.

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

## Abierta vs programada

- **Abierta:** instancia DB activa (tarea `PENDING`/`SUBMITTED`/`OVERDUE`, gasto `OPEN`).
- **Programada:** proyección en cliente desde la abierta (`projectOccurrenceDates`) hasta el horizonte del calendario.
- Excepciones puntuales en `recurrence_config.skipped_dates` y `assignee_overrides` (no rompen la plantilla).
- Cancelar abierta → `SKIPPED` y se spawnea la siguiente. Cancelar programada → añade la fecha a `skipped_dates`.
- Gastos: privacidad RLS = solo involucrados (`paid_by` o share). El acreedor cancela/reasigna.

## Ausencias y rotación

Tabla `member_absences` (ver [`src/lib/absences.ts`](../src/lib/absences.ts)):

| Campo | Descripción |
|-------|-------------|
| `start_date` / `end_date` | Rango inclusive (día local) |
| `reason` | Opcional, visible en Agenda |

**Rotación automática** (`auto_assign`):

1. `filterAvailableMemberIds` quita ausentes del pool en la fecha de `due_at`.
2. `pickNextAvailableAssignee` hace round-robin solo entre disponibles.
3. El ausente no “pierde” su turno: al volver entra en el ciclo sin deuda acumulada.
4. Si **todos** están ausentes → la fecha se añade a `skipped_dates` y se busca la siguiente ocurrencia.

**Asignación manual:** bloqueo en UI y API si el compañero está ausente en esa fecha.

Registro y listado en **Home → Agenda → Ausencias**. Calendario: punto violeta en días con alguna ausencia.

## Periodos de exámenes (modo silencio)

Tabla `member_exam_periods` (ver [`src/lib/exam-periods.ts`](../src/lib/exam-periods.ts)):

| Campo | Descripción |
|-------|-------------|
| `start_date` / `end_date` | Rango inclusive |
| `label` | Nombre visible (ej. «Finales») |

**No afecta la rotación:** las tareas se asignan con normalidad.

**Calendario:** franjas celestes `📚 Exámenes: [Label] · [Nombre]` + sombreado en celdas.

**Modo silencio:** aviso empático antes de quejas directas (impugnar implementado; push documentado en [`notifications.md`](./notifications.md)).

## UI

- Formularios: `RecurrenceEditor` + `DueDateFields` + `DateTimePickerModal`.
- Periódicas: etiqueta **Primer vencimiento** (fecha límite) o **Primer día de ejecución** (fecha de ejecución); sin banner de “este periodo…”.
- Semanal/mensual: día obligatorio; calendario solo habilita días válidos; sync bidireccional.
- Pausa indefinida disponible; no hay selector de meses activos en UI.
- Tarjetas activas: `formatDueSummary` (se conserva bajo la fecha).
- Historial: Programada + Realización.
- Tests: [`__tests__/features/task-recurrence.test.ts`](../__tests__/features/task-recurrence.test.ts), [`__tests__/lib/status-icons-time.test.ts`](../__tests__/lib/status-icons-time.test.ts), [`__tests__/lib/absences.test.ts`](../__tests__/lib/absences.test.ts), [`__tests__/lib/exam-periods.test.ts`](../__tests__/lib/exam-periods.test.ts).
