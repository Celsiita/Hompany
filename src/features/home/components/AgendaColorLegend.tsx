import { Text, View } from 'react-native';

import { useLocale } from '@/providers/LocaleProvider';

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
 * Visual color key for agenda markers (shown inside the calendar HelpTip sheet).
 */
export function AgendaColorLegend() {
  const { t } = useLocale();
  return (
    <View className="gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
        <LegendDot className="bg-blue-600" label={t('chip.yourTask')} />
        <LegendDot className="border border-sky-600 bg-transparent" label={t('chip.peer')} />
        <LegendDot className="bg-rose-500" label={t('chip.youOwe')} />
        <LegendDot className="bg-amber-500" label={t('chip.theyOwe')} />
      </View>
      <Text className="text-[11px] leading-4 text-stone-500">{t('legend.life')}</Text>
    </View>
  );
}
