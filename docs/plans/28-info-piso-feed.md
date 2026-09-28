---
name: Info práctica del piso en Feed
overview: Tarjeta Info del piso en Home Feed (Wi‑Fi, portal, basura, notas) editable por cualquier miembro, con copy-to-clipboard y voz de Mico.
status: completed
date: 2026-09-06
todos:
  - id: migration
    content: Columnas homes + RPC update_home_practical_info
    status: completed
  - id: feed-ui
    content: HomeInfoCard en Feed + HomeProvider
    status: completed
  - id: docs
    content: PRODUCT + índice de planes
    status: completed
---

# Plan 28 — Info del piso

## Campos (`homes`)

| Campo | Uso |
|-------|-----|
| `wifi_ssid` | Nombre de la red |
| `wifi_password` | Contraseña (copiable; ver/ocultar) |
| `portal_code` | Código portal / portero |
| `bin_day` | Basura / reciclaje |
| `notes` | Notas libres |

## UX

- Card en **Feed** bajo métricas.
- Vacío: bocadillo de Mico invitando a rellenar.
- Edición en bottom sheet; cualquier miembro puede guardar (RPC).
- Copiar Wi‑Fi / contraseña / portal.

## Seguridad

- Visible solo a miembros del hogar (RLS select existente).
- Mutación vía `update_home_practical_info` (security definer + `is_home_member`).
- No cambia `name` ni `invite_code`.
