import { Text, View } from 'react-native';

import { HelpTip } from '@/components/ui/HelpTip';

type LegendDotProps = {
  className: string;
  label: string;
};

/**
 * Compact swatch + label for the agenda color key.
 */
function LegendDot({ className, label }: LegendDotProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2.5 w-2.5 rounded-full ${className}`} />
      <Text className="text-[11px] text-stone-700">{label}</Text>
    </View>
  );
}

/**
 * Color legend under the agenda calendar (tasks blue / expenses amber-rose).
 */
export function AgendaColorLegend() {
  return (
    <View className="gap-1.5 rounded-xl border border-stone-200 bg-white/80 px-3 py-2.5">
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
        <LegendDot className="bg-blue-600" label="Tu tarea" />
        <LegendDot className="bg-sky-500" label="Compañero" />
        <LegendDot className="bg-rose-500" label="Debes" />
        <LegendDot className="bg-amber-500" label="Te deben" />
        <LegendDot className="bg-red-500" label="Urgente" />
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px]">🔇</Text>
          <Text className="text-[11px] text-stone-700">Silencio</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px]">🧳</Text>
          <Text className="text-[11px] text-stone-700">Ausencia</Text>
        </View>
        <HelpTip
          title="Colores de la agenda"
          message="Azul = tus tareas. Cielo = compañeros. Rosa = debes. Ámbar = te deben. Rojo = vencida. 🔇 = silencio. 🧳 = ausencia."
        />
      </View>
    </View>
  );
}
