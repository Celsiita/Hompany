import { Text, View } from 'react-native';

import type { StatusBadgeTone } from '@/lib/status-badges';

type StatusBadgeProps = {
  tone: StatusBadgeTone;
};

/**
 * High-contrast status chip for task and expense cards.
 */
export function StatusBadge({ tone }: StatusBadgeProps) {
  return (
    <View className={`rounded-full px-3 py-1 ${tone.bg}`}>
      <Text className={`text-xs font-semibold ${tone.text}`}>{tone.label}</Text>
    </View>
  );
}
