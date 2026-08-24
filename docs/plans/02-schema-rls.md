---
name: Schema multi-tenant y RLS
overview: "Paso 2: migraciones SQL para homes, home_members y tasks (máquina de estados), RLS por home_id, seeds locales, tipos TypeScript/Zod y helpers de aislamiento multi-tenant."
status: completed
date: 2026-08-16
todos:
  - id: migration-schema
    content: Migración SQL homes, home_members, tasks + enum + RLS
    status: completed
  - id: seed-data
    content: Seed local de desarrollo
    status: completed
  - id: types-schemas
    content: database.types, Zod schemas y helper requireHomeId
    status: completed
  - id: tests-docs
    content: Tests de dominio y actualización de docs
    status: completed
---

# Plan: Schema multi-tenant y RLS (Paso 2)

## Objetivo

Establecer el modelo de datos del piso compartido con aislamiento por `home_id`, alineado con `.cursorrules`.

## Alcance

**Incluye:**

- Tablas `profiles`, `homes`, `home_members`, `tasks`
- Enum Postgres `task_status` (PENDING … SKIPPED)
- Funciones RLS `is_home_member` / `is_home_owner`
- Políticas RLS en todas las tablas de hogar
- Trigger de perfil al registrarse (`auth.users` → `profiles`)
- Seed local mínimo
- Tipos TS (`database.types.ts`), schemas Zod y helper `requireHomeId`
- Tests unitarios del dominio

**Fuera de alcance (Paso 3+):**

- UI de login/registro
- Provider `activeHomeId` en React
- Storage de fotos / Realtime
- Asignación semanal automática de tareas

## Modelo

```mermaid
erDiagram
  profiles ||--o{ home_members : belongs
  homes ||--o{ home_members : has
  homes ||--o{ tasks : has
  profiles ||--o{ tasks : assigned

  homes {
    uuid id PK
    text name
    text invite_code
    uuid created_by
  }
  home_members {
    uuid id PK
    uuid home_id FK
    uuid user_id FK
    text role
    int reputation_points
  }
  tasks {
    uuid id PK
    uuid home_id FK
    text title
    task_status status
    uuid assigned_to
    timestamptz due_at
    text proof_image_url
  }
```

## Criterios de éxito

- Migración aplicable con `npm run db:reset`
- Ninguna query a tablas de hogar sin filtro `home_id` en el cliente tipado
- RLS impide leer datos de otro piso
- Tests de `requireHomeId`, schemas Zod y enum de estados en verde
