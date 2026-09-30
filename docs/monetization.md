# Monetización (RevenueCat)

HOMPANY usa [RevenueCat](https://www.revenuecat.com/) para **HOMPANY Plus**. El core (tareas, gastos, agenda, piso, clasificación) y los packs de iconos siguen gratis.

**Hoy (Shipaton):** paywall + entitlement cableados; teaser **Próximamente** (Feed bajo ranking + cabecera Piso) cuenta la historia: Plus = descubrir piso/gente usando la reputación como señal de confianza.

**Roadmap:** perfiles opt-in → listados Plus → solicitud → membership.

## Entitlement

| Id | Qué desbloquea |
|----|----------------|
| `hompany_plus` | Paywall Shipaton + (roadmap) matching / descubrir |

Código: [`src/lib/purchases/entitlements.ts`](../src/lib/purchases/entitlements.ts), UI teaser en Feed/Piso y Ajustes.

## Setup local / Shipaton

1. Crea un proyecto en el dashboard de RevenueCat.
2. Conecta **Test Store** (Next Gen: sin App Store / Play obligatorios).
3. Producto → entitlement `hompany_plus` → offering por defecto → paywall.
4. Copia la **public API key** a `.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=test_xxxxxxxx
```

5. `npm install` y arranca la app. En **Expo Go**, el SDK usa Preview API Mode (flujos UI; compras reales requieren development build).

## Arquitectura

- `PurchasesProvider` configura el SDK, hace `logIn(supabaseUserId)` y expone `isPlus` / `presentPaywall` / `restorePurchases`.
- Sin clave API la app arranca igual (`isConfigured: false`); el paywall muestra instrucciones.
- Dependencias: `react-native-purchases`, `react-native-purchases-ui`.
