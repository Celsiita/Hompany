---
name: Tutorial Mico (onboarding)
overview: Tutorial de primera apertura narrado por Mico, con replay desde Ajustes. Feed sin cara ni «Mico dice».
status: completed
date: 2026-09-06
todos:
  - id: feed-clean
    content: Quitar cara dibujada y bocadillos Mico del Feed; avisos neutrales
    status: completed
  - id: tutorial-host
    content: Pasos + AsyncStorage + TutorialHost/Provider en AppProviders
    status: completed
  - id: settings-replay
    content: Botón Ver tutorial en Ajustes
    status: completed
  - id: tests-docs
    content: Tests tutorial/mascot + PRODUCT
    status: completed
---

# Plan 30 — Tutorial Mico

## Alcance

1. **Feed limpio:** salud del piso sin quip/cara; ranking e info sin «Mico dice»; avisos sin prefijos de mascota.
2. **Tutorial:** modal en 1ª apertura (usuario + piso activo) con pasos Feed / Agenda / Tareas / Gastos / Ajustes.
3. **Replay:** Ajustes → Ayuda → **Ver tutorial**.
4. Persistencia: `AsyncStorage` key `hompany.tutorial.completed.v1`.

## Archivos

| Pieza | Ruta |
|-------|------|
| Pasos + storage | `src/lib/tutorial.ts` |
| UI modal | `src/features/onboarding/components/TutorialHost.tsx` |
| Provider | `src/providers/TutorialProvider.tsx` |
| Wiring | `src/providers/AppProviders.tsx`, Settings |

## Fuera de alcance

- Spotlights / highlights de UI real.
- Skins o Lottie de Mico.
- Tutorial por pantalla contextual.
