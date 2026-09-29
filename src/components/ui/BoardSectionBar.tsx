import { Pressable, Text, View } from 'react-native';

type BoardSection = 'ACTIVE' | 'HISTORY';

type BoardSectionBarProps = {
  section: BoardSection;
  onSectionChange: (value: BoardSection) => void;
  activeLabel: string;
  historyLabel?: string;
  /** Visual accent: tasks blue, expenses amber. */
  accent?: 'blue' | 'amber' | 'teal';
};

const ACTIVE_CLASS = {
  blue: 'bg-blue-50 border border-blue-300',
  amber: 'bg-amber-50 border border-amber-300',
  teal: 'bg-teal-50 border border-teal-300',
} as const;

/**
 * Switches between the live board and the in-section history list.
 */
export function BoardSectionBar({
  section,
  onSectionChange,
  activeLabel,
  historyLabel = 'Historial',
  accent = 'teal',
}: BoardSectionBarProps) {
  const activeClass = ACTIVE_CLASS[accent];
  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => onSectionChange('ACTIVE')}
        className={`flex-1 rounded-xl px-3 py-2 ${
          section === 'ACTIVE' ? activeClass : 'bg-stone-50 border border-stone-200'
        }`}>
        <Text className="text-center text-sm font-semibold text-stone-800">{activeLabel}</Text>
      </Pressable>
      <Pressable
        onPress={() => onSectionChange('HISTORY')}
        className={`flex-1 rounded-xl px-3 py-2 ${
          section === 'HISTORY' ? activeClass : 'bg-stone-50 border border-stone-200'
        }`}>
        <Text className="text-center text-sm font-semibold text-stone-800">{historyLabel}</Text>
      </Pressable>
    </View>
  );
}

export type { BoardSection };
