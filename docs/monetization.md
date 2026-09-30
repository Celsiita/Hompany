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

| Package id | Tipo | Precio sugerido (estudiantes / Test Store) |
|------------|------|--------------------------------------------|
| `monthly` | Suscripción mensual | **0,99 €** / mes |
| `yearly` | Suscripción anual | **4,99 €** / año |
| `lifetime` | Compra única | **9,99 €** |

Todos deben desbloquear el entitlement `hompany_plus`.

Los precios se editan en el **dashboard de RevenueCat** (Test Store → Products), no en el código. El paywall de la app muestra lo que venga de RC y permite elegir idioma **ES / EN**.

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

En **Expo Go** el paywall nativo de RevenueCatUI no funciona (Preview API). La app abre un **sheet propio** con monthly / yearly / lifetime vía `getOfferings` + `purchasePackage`. Para el paywall visual de RC: development build (`npx expo run:android` / EAS).

## Arquitectura

- `PurchasesProvider`: `configure` + `logIn(supabaseUserId)` + `presentPaywall` / `restorePurchases`.
- Sin clave API la app arranca igual (`isConfigured: false`).
