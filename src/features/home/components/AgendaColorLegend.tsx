import { Text, View } from 'react-native';

import { HelpTip } from '@/components/ui/HelpTip';

/**
 * Color legend under the agenda calendar.
 */
export function AgendaColorLegend() {
  return (
    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-stone-200 bg-white/80 px-3 py-2">
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        <Text className="text-[11px] text-stone-700">Tu tarea</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-2.5 rounded-full border border-sky-600 bg-transparent" />
        <Text className="text-[11px] text-stone-700">Compañero</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-2.5 rounded-full bg-amber-500" />
        <Text className="text-[11px] text-stone-700">Gasto</Text>
      </View>
      <HelpTip
        title="Colores de la agenda"
        message="Azul = tus tareas. Círculo hueco cielo = tareas de compañeros. Ámbar = gastos. Rojo en las tarjetas = vencido."
      />
    </View>
  );
}
