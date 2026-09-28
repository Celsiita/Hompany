---
name: Presencia, ausencia de sistema y ausencias puntuales
overview: "Estancia en el piso (periodos meses/fechas) + ausencia indefinida/planificada que congela la app (salvo gastos atrasados), y ausencias puntuales (solo tareas + reasignación rotativa)."
status: completed
date: 2026-09-02
todos:
  - id: filters-polish
    content: Emoji mono, filtros unificados, Mis deudas/Mis cobros
    status: completed
  - id: db-presence-leave
    content: Tablas presence periods + system leaves + RLS
    status: completed
  - id: rules-lib
    content: Helpers presencia/leave + filtrado avisos/tareas/gastos
    status: completed
  - id: punctual-reassign
    content: Aviso al registrar ausencia puntual + reasignar rotativas
    status: completed
  - id: home-ui
    content: Menú Home ⋮ Estancia + ausencia de sistema (meses o fechas)
    status: completed
  - id: tests-docs
    content: Tests unitarios + docs PRODUCT/notifications
    status: completed
---

# Plan 23 — Presencia y ausencias de sistema

**Estado:** implementación lista en código. Aplicar migraciones locales/remotas.

## Distinción de ausencias

| Tipo | Alcance | Efecto |
|------|---------|--------|
| **Puntual** (`member_absences`) | Solo tareas | Fuera de rotación; no gastos; aviso si hay tareas; rotativas se reasignan (+ aviso) |
| **Indefinida / planificada** (`member_system_leaves`) | Todo el sistema | Sin tareas, sin gastos nuevos/participación, sin notificaciones excepto **gastos atrasados** |
| **Estancia en el piso** (`member_presence_periods`) | Presencia esperada | Individual; menú Home ⋮. Meses o fechas concretas. Si hay periodos y hoy no cubierto → leave de sistema |

## Modelo

### `member_presence_periods`
- `home_id`, `user_id`, `start_date`, `end_date`, `source` (`MONTH` \| `RANGE`)
- Cubrir un mes = periodo del día 1 al último día; o rango libre en calendario
- Vacío = aún no configurado → se considera presente (compatibilidad)

### `member_system_leaves`
- `kind`: `INDEFINITE` \| `PLANNED`
- `start_date` date not null
- `end_date` date null (obligatorio null si indefinida; required si planificada)
- Activa si `start_date <= hoy` y (`end_date` null o `hoy <= end_date`)

## Reglas de producto

1. **Leave de sistema** = fila activa en `member_system_leaves` **o** (presencia configurada y hoy fuera de periodos).
2. En leave: ocultar tablero de tareas/gastos propios, no validar, no avisos salvo `expense_overdue`.
3. **Puntual**: al guardar, si hay tareas abiertas asignadas en el rango → diálogo de aviso; si `auto_assign`, reasignar con `pickNextAvailableAssignee` y registrar actividad.

## UI

- Home ⋮ → **Estancia y ausencia de sistema** (modal con Estancia + leave; info tips)
- Agenda: solo ausencias puntuales + modo silencio (exámenes)
- Relación: Estancia define cuándo estás «en el piso»; leave es ausencia total del sistema
