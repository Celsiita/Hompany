# Monetización (RevenueCat)

HOMPANY usa [RevenueCat](https://www.revenuecat.com/) para **HOMPANY Plus**. El core (tareas, gastos, agenda, piso, clasificación) y los packs de iconos siguen gratis.

## Qué hay hoy

- Sección **HOMPANY Plus** en Ajustes (Ver / Restaurar).
- Teaser **Próximamente** en cabecera de **Piso** (matching roadmap; puede abrir paywall).

## Entitlement

| Id | Uso |
|----|-----|
| `hompany_plus` | Paywall Shipaton + roadmap matching |

Código: [`src/lib/purchases/entitlements.ts`](../src/lib/purchases/entitlements.ts), `PurchasesProvider`, Ajustes / Piso.

## Productos (default offering)

| Package id | Tipo |
|------------|------|
| `monthly` | Suscripción mensual |
| `yearly` | Suscripción anual |
| `lifetime` | Compra única |

Todos deben desbloquear el entitlement `hompany_plus`.

1. [app.revenuecat.com](https://app.revenuecat.com) → crea proyecto **HOMPANY**.
2. Añade app → **Test Store** (Next Gen, sin App Store).
3. Entitlement id exacto: `hompany_plus`.
4. Producto (p. ej. suscripción mensual) → vincúlalo al entitlement.
5. Offering por defecto + Paywall (RevenueCat Paywalls).
6. Copia la **Public API key** del Test Store a `.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=test_xxxxxxxx
```

7. Reinicia Metro (`npm start`). En Ajustes → Ver HOMPANY Plus.

En Expo Go el SDK usa Preview API Mode; compra real de Test Store suele requerir development build.

## Arquitectura

- `PurchasesProvider`: `configure` + `logIn(supabaseUserId)` + `presentPaywall` / `restorePurchases`.
- Sin clave API la app arranca igual (`isConfigured: false`).
