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
      <Text className="text-[11px] font-medium text-stone-700">{label}</Text>
    </View>
  );
}

/**
 * Short color legend: the 4 money/task dots + help for silence/absence/urgent.
 */
export function AgendaColorLegend() {
  return (
    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-stone-200 bg-white/90 px-3 py-2">
      <LegendDot className="bg-blue-600" label="Tu tarea" />
      <LegendDot className="border border-sky-600 bg-transparent" label="Compañero" />
      <LegendDot className="bg-rose-500" label="Debes" />
      <LegendDot className="bg-amber-500" label="Te deben" />
      <HelpTip
        title="Colores de la agenda"
        message="Azul = tus tareas. Círculo hueco = compañeros. Rosa = debes. Ámbar = te deben. En el día: 🔇 silencio, 🧳 ausencia. Rojo en la lista = vencida."
      />
    </View>
  );
}
