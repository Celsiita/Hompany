---
name: Auth y hogar activo
overview: "Paso 3: sesión Supabase Auth (login/registro), HomeProvider con activeHomeId persistido, crear/unir piso por invite code, y gate de navegación según sesión/membresía."
status: completed
date: 2026-08-16
todos:
  - id: auth-provider
    content: AuthProvider + sesión Supabase con AsyncStorage
    status: completed
  - id: home-provider
    content: HomeProvider con activeHomeId persistido
    status: completed
  - id: auth-screens
    content: Pantallas login/registro + rutas (auth)
    status: completed
  - id: home-onboarding
    content: Crear/unir piso + RPCs invite + gate de navegación
    status: completed
  - id: tests-docs
    content: Tests + docs/índice de planes
    status: completed
---

# Plan: Auth y hogar activo (Paso 3)

## Objetivo

Que un usuario pueda registrarse/iniciar sesión, crear o unirse a un piso, y operar siempre con un `home_id` activo.

## Alcance

**Incluye:**

- Cliente Supabase con persistencia de sesión (AsyncStorage)
- `AuthProvider` + hooks `useAuth`
- `HomeProvider` + `activeHomeId` en AsyncStorage
- RPCs `create_home`, `get_home_by_invite_code`, `join_home_by_invite_code`
- Pantallas login / registro / setup de piso
- Gate Expo Router: sin sesión → auth; sin hogar → onboarding; con ambos → tabs
- Tests de schemas, storage key y helpers de auth/home

**Fuera de alcance (Paso 4+):**

- Realtime / Storage fotos
- Asignación semanal de tareas
- UI completa del feed gamificado

## Flujo

```mermaid
flowchart TD
  Start[App start] --> Session{Sesión?}
  Session -->|No| Auth[Login / Registro]
  Session -->|Sí| Homes{Tiene home?}
  Homes -->|No| Setup[Crear o unir piso]
  Homes -->|Sí| Tabs[Tabs Home/Tareas/Historial]
  Auth --> Session
  Setup --> Tabs
```

## Criterios de éxito

- Login/registro funcionan contra Supabase local
- Tras login sin membresía se muestra setup de piso
- Crear piso genera invite code y fija `activeHomeId`
- Unir por código añade membership y fija `activeHomeId`
- Tabs solo accesibles con sesión + `home_id` activo
- `npm test` en verde
