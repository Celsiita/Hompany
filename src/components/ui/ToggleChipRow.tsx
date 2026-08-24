import { Pressable, ScrollView, Text, View } from 'react-native';

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
            <Pressable
              key={chip.key}
              onPress={() => onChange(active ? 'ALL' : chip.key)}
              className={`rounded-full px-4 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
