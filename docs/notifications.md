# Recordatorios y notificaciones

HOMPANY avisa en la app. El push remoto queda documentado para un development build (EAS), porque Expo Go / web no cubren FCM de forma fiable.

## Qué se notifica (catálogo)

Definido en [`src/features/home/lib/alerts.ts`](../src/features/home/lib/alerts.ts) (`NOTIFICATION_CATALOG` + `buildHomeAlerts`).

| Id | Evento | Cuándo | Canal hoy |
|----|--------|--------|-----------|
| `task_due_soon` | Tarea próxima a vencer | `PENDING` y faltan ≤ 24 h | Campanita Home |
| `task_overdue` | Tarea fuera de plazo | `OVERDUE` o `due_at` pasado | Campanita Home |
| `task_proof_review` | Foto para validar | Compañero en `SUBMITTED` | Campanita Home |
| `expense_created` | Nuevo gasto | Alta que te incluye (≤ 48 h) | Campanita Home |
| `expense_settled` | Deuda saldada | Gasto `SETTLED` reciente (≤ 48 h) | Campanita Home |
| `expense_overdue` | Gasto fuera de plazo | `OPEN` y `due_at` pasado | Campanita Home + countdown |

## Comportamiento actual

- Campanita en la cabecera de Home (badge rojo si hay urgentes) abre el inbox. **No hay lista de avisos en el Feed ni en el menú ⋮.**
- Inbox agrupado: Urgente / Pronto / Por revisar / Gastos. Tocar un aviso abre la tarjeta en Tareas o Gastos.
- Ausencias, modo silencio y visitas del calendario se gestionan desde el menú ⋮.
- Packs de iconos: solo en Ajustes.
- Iconos `?` explican cada sección (Feed, Agenda, Piso, Tareas, Gastos, Ajustes).
- Tarjetas de tarea y gasto muestran cuenta atrás respecto a `due_at`.
- `home_activity_events` registra admin, repetir, reabrir, roles y expulsiones (historial, no editable).

## Push local (siguiente paso nativo)

En un development build con `expo-notifications`:

1. Pedir permiso al entrar al piso.
2. Al crear/editar una tarea o gasto con `due_at`, programar un trigger `date = due_at - 24h` y otro `date = due_at`.
3. Cancelar el trigger si se completa, salda o pausa.
4. En `SUBMITTED`, notificación a los demás miembros (requiere backend o Realtime + handler).
5. En alta/saldado de gasto, igual.

Identificadores sugeridos: `task:{id}:soon`, `task:{id}:due`, `expense:{id}:soon`.

## Push remoto (producción)

- Proyecto EAS + FCM (Android) / APNs (iOS).
- Token por usuario en una tabla `push_tokens (user_id, home_id, token)`.
- Edge Function o cron de Supabase que lea `due_at` y dispare Expo Push API.
- RLS: solo el dueño del token escribe su fila.

Hasta entonces, el contrato de producto es la hoja de avisos del menú Home ⋮ + countdown. No hay envío silencioso en segundo plano en Expo Go SDK 57.

## Ausencias puntuales vs ausencia de sistema

| Tipo | Tabla | Efecto en avisos |
|------|-------|------------------|
| Puntual | `member_absences` | Solo tareas: sin avisos de tareas propias en fechas ausentes; gastos siguen |
| Indefinida / planificada | `member_system_leaves` | Congela avisos de tareas y gastos **excepto** `expense_overdue` |

UI: panel **Ausencias** en Agenda (tipos Puntual | Indefinida/planificada). Sin estancia en el piso.

Helpers: [`src/lib/presence.ts`](../src/lib/presence.ts), plan [`23-presencia-ausencia-sistema.md`](./plans/23-presencia-ausencia-sistema.md).

## Modo silencio (periodo de exámenes)

Tabla `member_exam_periods` (ver [`src/lib/exam-periods.ts`](../src/lib/exam-periods.ts)).

| Regla | Comportamiento |
|-------|----------------|
| Rotación de tareas | **Sin cambios** — el compañero sigue recibiendo su turno |
| Calendario común | Franjas celestes `📚 Exámenes: [Label] · [Nombre]` |
| Quejas / mensajes directos | Antes de enviar, mostrar: `Recuerda que [Nombre] está en periodo de exámenes` |

### Implementado hoy

- **Impugnar tarea** (`TasksScreen`): diálogo de confirmación si el asignado está en periodo de exámenes (`shouldWarnExamSilence` + `examSilenceWarning`).

### Contrato para push / mensajería (futuro)

Al implementar notificaciones directas o quejas entre compañeros:

1. Resolver `member_exam_periods` del destinatario para la fecha del evento.
2. Si `shouldWarnExamSilence({ actorUserId, targetUserId, periods })` → interstitial o banner con `examSilenceWarning(displayName)` antes de confirmar el envío.
3. **No** bloquear el envío por defecto (solo aviso empático), salvo que producto decida endurecerlo.
4. No suprimir avisos de sistema del propio usuario (sus tareas, sus gastos).
5. Identificador sugerido en catálogo: `exam_silence_hint` (in-app toast / modal previo).

Helpers reutilizables: `isUserInExamPeriodOnDate`, `examSilenceWarning`, `shouldWarnExamSilence`.
