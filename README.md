# HOMPANY

App gamificada para la gestión y convivencia en pisos compartidos.

**Shipaton 2026 — Next Gen:** vídeo demo + repo open source (MIT). Monetización con [RevenueCat](./docs/monetization.md) (`hompany_plus`).

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

1. Login Ana → **Home Feed** (salud + ranking).
2. **Agenda** → un ítem del calendario.
3. **Tareas** → entregar con foto / ver countdown.
4. **Gastos** → balance “quién debe a quién”.
5. **Ajustes** → **HOMPANY Plus** → paywall RevenueCat → unlock packs Hogar/Play.

Detalle de producto: [`docs/PRODUCT.md`](./docs/PRODUCT.md). Monetización: [`docs/monetization.md`](./docs/monetization.md). Arquitectura: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

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
