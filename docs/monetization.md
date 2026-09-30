# Monetización (RevenueCat)

HOMPANY usa [RevenueCat](https://www.revenuecat.com/) para **HOMPANY Plus**: **insights de reputación** en el Feed (puesto, distancia al primero, pts por tareas). El core (tareas, gastos, agenda, piso) y los packs de iconos siguen gratis.

## Entitlement

| Id | Qué desbloquea |
|----|----------------|
| `hompany_plus` | Tarjeta **Reputación Plus** en Feed + badge Plus |

Código: [`src/lib/purchases/entitlements.ts`](../src/lib/purchases/entitlements.ts), UI en Feed (`ReputationInsightsCard`) y Ajustes.

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
