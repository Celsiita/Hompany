import { Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

export type FilterToggleOption<T extends string> = {
  value: T;
  label: string;
};

type FilterTogglePairProps<T extends string> = {
  value: T | 'ALL';
  options: readonly [FilterToggleOption<T>, FilterToggleOption<T>];
  onChange: (value: T | 'ALL') => void;
  /** When true, selecting the other option replaces; tapping active clears to ALL. */
  clearable?: boolean;
};

function optionStyle(active: boolean) {
  return mergeStyles(
    interactive.roundedXl,
    {
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    active
      ? { borderColor: palette.blue400, backgroundColor: palette.blue50 }
      : { borderColor: palette.gray200, backgroundColor: palette.gray50 },
  );
}

/**
 * Two equal toggle buttons used for scope filters (Mis tareas / Compañeros, etc.).
 * Shared visual + functional style across Home, Tareas and Gastos.
 */
export function FilterTogglePair<T extends string>({
  value,
  options,
  onChange,
  clearable = true,
}: FilterTogglePairProps<T>) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <SafePressable
            key={option.value}
            onPress={() => {
              if (active && clearable) {
                onChange('ALL');
                return;
              }
              onChange(option.value);
            }}
            style={{ flex: 1 }}
            contentStyle={optionStyle(active)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text className="text-center text-sm font-semibold text-gray-800">{option.label}</Text>
          </SafePressable>
        );
      })}
    </View>
  );
}
