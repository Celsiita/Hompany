# HOMPANY

App gamificada para la gestión y convivencia en pisos compartidos.

**Shipaton 2026 — Next Gen:** *deja de discutir por las tareas y el dinero.* Vídeo + repo MIT. Plus vía RevenueCat ([setup](./docs/monetization.md)). Guion: [`docs/SHIPATON-DEMO.md`](./docs/SHIPATON-DEMO.md).

## Stack

- React Native + Expo (Expo Router)
- TypeScript (strict)
- Supabase (PostgreSQL, Auth, Storage)
- RevenueCat (`react-native-purchases` + Paywalls UI)
- NativeWind (Tailwind CSS)
- Zod + Jest

## Prerrequisitos

- Node.js 20+
- npm
- Docker Desktop (para Supabase local)
- Expo Go o emulador iOS/Android

## Configuración inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Opcional Shipaton: EXPO_PUBLIC_REVENUECAT_API_KEY=test_… (Test Store)

# 3. Levantar Supabase local (requiere Docker)
npm run db:start

# 4. Arrancar la app
npm start
```

## Seed local (desarrollo / demo)

Tras `npm run db:reset`:

| Email | Password | Rol |
|-------|----------|-----|
| `ana@hompany.local` | `password123` | owner |
| `bruno@hompany.local` | `password123` | member |

Invite code seed: `DEMO2026`. Tras un reset, cierra sesión y vuelve a entrar.

## Demo Shipaton (script ~90 s)

1. Login Ana → tour Mico (sáltelo o avance 2 pasos).
2. **Inicio → Feed:** cumplimiento + ranking + cuentas; toca `?`.
3. **Agenda:** leyenda de colores + un día.
4. **Piso:** Wi‑Fi / reglas.
5. **Tareas** → chips Tuya/Compañero + countdown; **campanita** si hay avisos.
6. **Gastos** → chips Debes / Tú pagaste + balance.
7. **Ajustes** → Ver HOMPANY Plus → unlock packs.

Detalle: [`docs/PRODUCT.md`](./docs/PRODUCT.md). Monetización: [`docs/monetization.md`](./docs/monetization.md). Guion vídeo: [`docs/SHIPATON-DEMO.md`](./docs/SHIPATON-DEMO.md).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo dev server |
| `npm test` | Ejecuta tests con Jest |
| `npm run db:start` | Levanta stack Supabase local |
| `npm run db:stop` | Detiene stack Supabase local |
| `npm run db:reset` | Resetea DB local y aplica migraciones |
| `npm run types:generate` | Genera tipos TS desde schema local |

## Estructura

```
app/          → Rutas Expo Router (delgadas)
src/features/ → Pantallas y lógica por módulo
src/lib/      → Cliente Supabase, env, RevenueCat helpers
supabase/     → Migraciones y config local
```

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
