import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type FilterGroupProps = {
  label: string;
  children: ReactNode;
};

/**
 * Labeled filter row — same chrome for Agenda, Tareas and Gastos.
 */
export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </Text>
      {children}
    </View>
  );
}
