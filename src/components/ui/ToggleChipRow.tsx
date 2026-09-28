import { ScrollView, Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

type Chip<T extends string> = {
  key: T;
  label: string;
};

type ToggleChipRowProps<T extends string> = {
  value: T | 'ALL';
  chips: Chip<T>[];
  onChange: (value: T | 'ALL') => void;
};

/**
 * Filter pills without an "All" chip. Tapping the active one clears the filter.
 */
export function ToggleChipRow<T extends string>({ value, chips, onChange }: ToggleChipRowProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 pr-2">
        {chips.map((chip) => {
          const active = value === chip.key;
          return (
            <SafePressable
              key={chip.key}
              onPress={() => onChange(active ? 'ALL' : chip.key)}
              contentStyle={mergeStyles(
                interactive.pill,
                active ? interactive.pillActive : interactive.pillInactive,
              )}>
              <Text style={{ fontWeight: '600', color: active ? palette.white : palette.gray700 }}>
                {chip.label}
              </Text>
            </SafePressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
