import { Text, View } from 'react-native';

import type { TutorialHighlight } from '@/lib/tutorial';

type TutorialPreviewProps = {
  highlight: TutorialHighlight;
};

function FocusRing({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View className="w-full gap-1.5">
      <View className="self-start rounded-md bg-teal-600 px-2 py-0.5">
        <Text className="text-[10px] font-bold text-white">Foco · {label}</Text>
      </View>
      <View className="rounded-2xl border-2 border-teal-500 bg-teal-50/80 p-1">{children}</View>
    </View>
  );
}

/**
 * Mini mock of the real screen so the tour is visual, not only text.
 * The focused zone is ringed so the explanation maps to a concrete UI piece.
 */
export function TutorialPreview({ highlight }: TutorialPreviewProps) {
  switch (highlight) {
    case 'feed':
      return (
        <FocusRing label="Estado + clasificación">
          <View className="gap-2 rounded-xl bg-white p-3">
            <View className="flex-row items-end justify-between">
              <Text className="text-2xl font-black text-emerald-900">78%</Text>
              <View className="rounded-full bg-emerald-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-emerald-900">Excelente</Text>
              </View>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-100">
              <View className="h-2 w-3/4 rounded-full bg-emerald-500" />
            </View>
            <View className="flex-row justify-between rounded-xl bg-teal-50 px-3 py-2">
              <Text className="text-xs text-stone-600">1. Tú · 112 pts</Text>
              <Text className="text-xs text-amber-800">Te deben 12 €</Text>
            </View>
          </View>
        </FocusRing>
      );
    case 'bell':
      return (
        <FocusRing label="Campanita">
          <View className="gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🔔</Text>
              <View className="rounded-md bg-red-500 px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-white">2</Text>
              </View>
              <Text className="text-xs font-semibold text-red-900">Avisos urgentes</Text>
            </View>
            <Text className="text-xs text-red-800">Fregar · vencida · toca para abrir</Text>
          </View>
        </FocusRing>
      );
    case 'agenda':
      return (
        <FocusRing label="Colores del calendario">
          <View className="gap-2 rounded-xl bg-white p-3">
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-row items-center gap-1">
                <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <Text className="text-[10px] text-stone-700">Tu tarea</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="h-2.5 w-2.5 rounded-full border border-sky-600" />
                <Text className="text-[10px] text-stone-700">Compañero</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <Text className="text-[10px] text-stone-700">Debes</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <Text className="text-[10px] text-stone-700">Te deben</Text>
              </View>
            </View>
            <View className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
              <Text className="text-xs font-semibold text-blue-950">Basura · tuya · hoy</Text>
            </View>
          </View>
        </FocusRing>
      );
    case 'piso':
      return (
        <FocusRing label="Vida del hogar">
          <View className="gap-1.5 rounded-xl bg-teal-50/80 p-3">
            <Text className="text-xs font-semibold text-violet-900">Reclamar silencio</Text>
            <Text className="text-xs font-semibold text-teal-900">Ausencias · Modo silencio · Visitas</Text>
            <Text className="text-xs text-stone-600">Wi‑Fi · Portal · Reglas</Text>
          </View>
        </FocusRing>
      );
    case 'tasks':
      return (
        <FocusRing label="Tarjeta de tarea">
          <View className="gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <View className="self-start rounded-md bg-blue-200/80 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-blue-950">Tuya</Text>
            </View>
            <Text className="text-sm font-semibold text-stone-900">Fregar cocina</Text>
            <Text className="text-xs text-stone-600">Foto → compañeros aprueban</Text>
          </View>
        </FocusRing>
      );
    case 'expenses':
      return (
        <FocusRing label="Chips Debes / Te deben">
          <View className="gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <View className="flex-row gap-2">
              <View className="rounded-md bg-rose-200/80 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-rose-950">Debes</Text>
              </View>
              <View className="rounded-md bg-amber-200/80 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-amber-950">Te deben</Text>
              </View>
            </View>
            <Text className="text-sm font-semibold text-stone-900">Compra súper · 24 €</Text>
          </View>
        </FocusRing>
      );
    case 'settings':
      return (
        <FocusRing label="Invitación y Plus">
          <View className="gap-2 rounded-xl bg-teal-50/80 p-3">
            <Text className="text-xs font-semibold text-teal-900">HOMPANY Plus · packs de iconos</Text>
            <Text className="text-xs text-stone-600">Código invitación · A1B2C3</Text>
          </View>
        </FocusRing>
      );
    default:
      return (
        <View className="w-full items-center rounded-2xl border border-teal-200 bg-teal-50/60 py-4">
          <Text className="text-4xl">🐵</Text>
          <Text className="mt-1 text-xs font-semibold text-teal-900">Tour de 1 minuto</Text>
        </View>
      );
  }
}
