import { Pressable, Text, View } from 'react-native';

type BoardSection = 'ACTIVE' | 'HISTORY';

type BoardSectionBarProps = {
  section: BoardSection;
  onSectionChange: (value: BoardSection) => void;
  activeLabel: string;
  historyLabel?: string;
};

/**
 * Switches between the live board and the in-section history list.
 */
export function BoardSectionBar({
  section,
  onSectionChange,
  activeLabel,
  historyLabel = 'Historial',
}: BoardSectionBarProps) {
  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => onSectionChange('ACTIVE')}
        className={`flex-1 rounded-xl px-3 py-2 ${section === 'ACTIVE' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
        <Text className="text-center text-sm font-semibold text-gray-800">{activeLabel}</Text>
      </Pressable>
      <Pressable
        onPress={() => onSectionChange('HISTORY')}
        className={`flex-1 rounded-xl px-3 py-2 ${section === 'HISTORY' ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
        <Text className="text-center text-sm font-semibold text-gray-800">{historyLabel}</Text>
      </Pressable>
    </View>
  );
}

export type { BoardSection };
