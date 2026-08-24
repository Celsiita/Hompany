# Recordatorios y notificaciones

HOMPANY avisa en la app. El push remoto queda documentado para un development build (EAS), porque Expo Go / web no cubren FCM de forma fiable.

## Qué se notifica (catálogo)

Definido en [`src/features/home/lib/alerts.ts`](../src/features/home/lib/alerts.ts) (`NOTIFICATION_CATALOG` + `buildHomeAlerts`).

| Id | Evento | Cuándo | Canal hoy |
|----|--------|--------|-----------|
| `task_due_soon` | Tarea próxima a vencer | `PENDING` y faltan ≤ 24 h | Menú Home ⋮ → Avisos |
| `task_overdue` | Tarea fuera de plazo | `OVERDUE` o `due_at` pasado | Menú Home ⋮ → Avisos |
| `task_proof_review` | Foto para validar | Compañero en `SUBMITTED` | Menú Home ⋮ → Avisos |
| `expense_created` | Nuevo gasto | Alta que te incluye (≤ 48 h) | Menú Home ⋮ → Avisos |
| `expense_settled` | Deuda saldada | Gasto `SETTLED` reciente (≤ 48 h) | Menú Home ⋮ → Avisos |
| `expense_overdue` | Gasto fuera de plazo | `OPEN` y `due_at` pasado | Menú Home ⋮ → Avisos + countdown en tarjeta |

## Comportamiento actual

- Home muestra hasta 6 avisos en la hoja **Avisos / Notificaciones** del menú ⋮ (rojo / ámbar / azul). El Feed solo indica si hay avisos pendientes.
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
