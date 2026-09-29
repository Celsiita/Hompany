import { ScrollView, Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

type ChipAccent = 'brand' | 'blue' | 'amber';

type Chip<T extends string> = {
  key: T;
  label: string;
  accent?: ChipAccent;
};

type ToggleChipRowProps<T extends string> = {
  value: T | 'ALL';
  chips: Chip<T>[];
  onChange: (value: T | 'ALL') => void;
};

const ACTIVE: Record<ChipAccent, { bg: string; text: string }> = {
  brand: { bg: palette.brand, text: palette.white },
  blue: { bg: '#2563eb', text: palette.white },
  amber: { bg: palette.amber500, text: '#1c1917' },
};

/**
 * Filter pills without an "All" chip. Tapping the active one clears the filter.
 * Optional accents keep task (blue) vs expense (amber) readable.
 */
export function ToggleChipRow<T extends string>({ value, chips, onChange }: ToggleChipRowProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 pr-2">
        {chips.map((chip) => {
          const active = value === chip.key;
          const accent = chip.accent ?? 'brand';
          return (
            <SafePressable
              key={chip.key}
              onPress={() => onChange(active ? 'ALL' : chip.key)}
              contentStyle={mergeStyles(
                interactive.pill,
                active
                  ? { backgroundColor: ACTIVE[accent].bg }
                  : interactive.pillInactive,
              )}>
              <Text
                style={{
                  fontWeight: '600',
                  color: active ? ACTIVE[accent].text : palette.gray700,
                }}>
                {chip.label}
              </Text>
            </SafePressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
