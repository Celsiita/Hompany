# Guion vídeo Shipaton (≤ 2 min) — ventajas primero

Grabar con seed limpio (`npm run db:reset`) + `EXPO_PUBLIC_REVENUECAT_API_KEY`.
**Ángulo:** deja de discutir · la app te avisa · hay prueba · el dinero está claro.

> En 2 min **no** cabe el 100 % de pantallas. Sí cabe el **100 % del valor**: avisos, plazos, prueba fotográfica, deudas y Plus.

## Mentalidad de grabación

1. **Empezar por el dolor** (campanita / vencidas / revisión), no por el login largo.
2. **Seed ya da drama:** tarea `SUBMITTED` (Baño), pendientes próximas, gastos `OPEN` → Ana ve badge en avisos.
3. **Cada plano = 1 ventaja** (no tours, no filtros, no settings basura).
4. UI en **English** para jueces; voz EN (humana si puedes).

## Guion denso (~110 s)

| Tiempo | Plano (qué grabar) | Qué decir (EN) | Ventaja |
|--------|-------------------|----------------|---------|
| 0–6 s | Title card | “HOMPANY — stop fighting over chores and money.” | Pitch |
| 6–14 s | Login Ana → Feed (skip tour) | “Student flats. Less chat drama.” | Contexto |
| 14–28 s | **Campanita** → sheet Avisos: Urgent / Review / Money | “When something is overdue, under review, or unpaid — you get a clear alert.” | **Avisos / recordatorios** |
| 28–42 s | Tarjeta tarea: countdown “Due tomorrow” + Complete | “Deadlines are visible. No ‘I forgot’.” | **Recordatorio de plazo** |
| 42–58 s | Baño **In review** → Approve / Dispute | “Done means a photo. Roommates approve or dispute.” | **Prueba, no pelea** |
| 58–72 s | Gastos: Debes / You paid → Settle | “Who owes whom, one tap.” | **Dinero claro** |
| 72–88 s | Piso: Quiet / Absences / Coming soon | “Exams, trips, visits — the flat calendar knows.” | **Convivencia real** |
| 88–102 s | Ajustes → View HOMPANY Plus (paywall) | “Plus is on RevenueCat. Matching is next.” | **Monetización Shipaton** |
| 102–110 s | End card | “Expo · Supabase · RevenueCat.” | Cierre |

## Qué NO grabar (roba segundos)

- Crear tipos custom, editar Wi‑Fi, QR largo, filtros avanzados, historial vacío, tutorial Mico, mensajes de error web.

## Setup técnico antes de darle al Rec

```bash
npm run db:reset
npx expo start --web --port 8082   # o dispositivo real (mejor)
# locale EN + tutorial completed en storage (el script de demo ya lo fuerza)
```

Comprobar en 10 s: campanita con **badge > 0**, al menos 1 tarea In review y 1 gasto abierto.

## Corte actual vs siguiente

- Corte actual: [`docs/demo-video/HOMPANY-Shipaton-Demo.mp4`](./demo-video/HOMPANY-Shipaton-Demo.mp4) (tour → tareas → gastos → Plus).
- **Siguiente corte objetivo:** mismo archivo, pero con **plano campanita/avisos** justo después del Feed (script `record-shipaton-demo.mjs`).

Subir a YouTube/Vimeo **público** → link en Devpost (`docs/DEVPOST.md`).
