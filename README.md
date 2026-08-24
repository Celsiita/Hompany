# HOMPANY

App gamificada para la gestión y convivencia en pisos compartidos.

## Stack

- React Native + Expo (Expo Router)
- TypeScript (strict)
- Supabase (PostgreSQL, Auth, Realtime, Storage)
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

# 3. Levantar Supabase local (requiere Docker)
npm run db:start

# 4. Arrancar la app
npm start
```

## Seed local (desarrollo)

Tras `npm run db:reset`:

| Email | Password | Rol |
|-------|----------|-----|
| `ana@hompany.local` | `password123` | owner |
| `bruno@hompany.local` | `password123` | member |

Invite code seed: `DEMO2026`. Tras un reset, cierra sesión y vuelve a entrar.
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
src/lib/      → Cliente Supabase, env, utilidades
supabase/     → Migraciones y config local
```

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles de arquitectura.
