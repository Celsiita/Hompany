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

/**
 * Two equal filter pills (same visual language as {@link ToggleChipRow}).
 * Shared across Home, Tareas and Gastos.
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
            contentStyle={mergeStyles(
              interactive.pill,
              interactive.center,
              active
                ? { backgroundColor: palette.brand }
                : interactive.pillInactive,
            )}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 13,
                color: active ? palette.white : palette.gray700,
              }}>
              {option.label}
            </Text>
          </SafePressable>
        );
      })}
    </View>
  );
}
