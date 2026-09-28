---
name: Refactor UI Agenda Home
overview: Simplificar filtros, calendario colapsable sincronizado con lista continua y tarjetas atenuadas para ítems programados.
status: completed
date: 2026-09-01
todos:
  - id: scope-filters
    content: Alcance (Mis cosas / Todo el piso) + chips Tareas/Gastos
    status: completed
  - id: calendar-list
    content: AgendaCalendar colapsable + AgendaList con scroll al día
    status: completed
  - id: item-cards
    content: AgendaItemCard con estilos open/scheduled
    status: completed
  - id: docs
    content: Actualizar PRODUCT, ARCHITECTURE y tests
    status: completed
---

# Plan 22: Refactor UI Agenda Home

## Objetivo

Reducir saturación visual en **Home → Agenda**, unificar filtros y sincronizar calendario con la lista de eventos.

## Cambios

### Filtros (dos niveles)

1. **Alcance** (segmented control): `Mis cosas` (default) | `Todo el piso`.
   - Mis cosas: tareas asignadas al usuario + gastos donde paga o participa.
   - Todo el piso: todas las tareas del hogar + gastos involucrados (RLS).
2. **Categorías** (chips multi-select): `Tareas` · `Gastos` (al menos una activa).

Mapeo interno: `toAgendaScopeFilter(viewScope, categories)` → flags legacy de `buildAgendaItems`.

### Calendario colapsable (`AgendaCalendar`)

- **Compacto (default):** franja de 7 días (semana actual) con navegación ‹ ›.
- **Expandido:** mes completo con bandas de exámenes y navegación mensual.
- Botón **Mes / Semana** alterna vistas.
- Puntos bajo cada día:
  - Azul sólido: tarea propia (abierta).
  - Azul claro: tarea propia programada.
  - Teal hueco: tarea de compañero (solo en «Todo el piso»).
  - Ámbar: gasto.
  - Violeta: ausencia.

### Lista continua (`AgendaList`)

- Muestra los días del rango visible (semana o mes según calendario).
- Tap en día del calendario → scroll suave a la sección del día.
- Día vacío: micro-texto «Nada previsto».
- Tarjetas `AgendaItemCard`: abiertas con borde/fondo normal; programadas atenuadas.

### Componentes sustituidos en `HomeAgenda`

| Antes | Después |
|-------|---------|
| `AgendaScopeBar` (4 chips + Restablecer) | Alcance + categorías |
| `WeekAgenda` + `MonthCalendar` apilados | `AgendaCalendar` + `AgendaList` |
| `DayAgendaSheet` al pulsar día | Scroll a sección en lista |

Los archivos legacy (`WeekAgenda`, `MonthCalendar`, `DayAgendaSheet`) permanecen en el repo pero ya no se usan en Home.

## Archivos clave

- `src/features/home/components/HomeAgenda.tsx`
- `src/features/home/components/AgendaScopeBar.tsx`
- `src/features/home/components/AgendaCalendar.tsx`
- `src/features/home/components/AgendaList.tsx`
- `src/features/home/components/AgendaItemCard.tsx`
- `src/features/home/lib/agenda-items.ts` (`toAgendaScopeFilter`, `computeAgendaDayDots`)
