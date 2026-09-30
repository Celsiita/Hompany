import { Text, View } from 'react-native';

import type { StatusBadgeTone } from '@/lib/status-badges';
import { displayStatusLabel } from '@/lib/i18n/display';
import { useLocale } from '@/providers/LocaleProvider';

type StatusBadgeProps = {
  tone: StatusBadgeTone;
};

/**
 * High-contrast status chip for task and expense cards.
 */
export function StatusBadge({ tone }: StatusBadgeProps) {
  const { t } = useLocale();
  return (
    <View className={`rounded-md px-3 py-1 ${tone.bg}`}>
      <Text className={`text-xs font-semibold ${tone.text}`}>
        {displayStatusLabel(tone.label, t)}
      </Text>
    </View>
  );
}
