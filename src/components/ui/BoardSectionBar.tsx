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

const ACTIVE_FILL = {
  blue: 'bg-blue-600',
  amber: 'bg-amber-500',
  teal: 'bg-teal-700',
} as const;

/**
 * Switches between the live board and history (same pill segment language as Home).
 */
export function BoardSectionBar({
  section,
  onSectionChange,
  activeLabel,
  historyLabel = 'History',
  accent = 'teal',
}: BoardSectionBarProps) {
  const fill = ACTIVE_FILL[accent];
  return (
    <View className="flex-row gap-1.5 rounded-2xl border border-stone-200 bg-white/80 p-1.5">
      <Pressable
        onPress={() => onSectionChange('ACTIVE')}
        accessibilityRole="tab"
        accessibilityState={{ selected: section === 'ACTIVE' }}
        className={`flex-1 rounded-xl px-3 py-2.5 ${
          section === 'ACTIVE' ? fill : 'bg-transparent'
        }`}>
        <Text
          className={`text-center text-sm font-bold ${
            section === 'ACTIVE' ? 'text-white' : 'text-stone-700'
          }`}>
          {activeLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onSectionChange('HISTORY')}
        accessibilityRole="tab"
        accessibilityState={{ selected: section === 'HISTORY' }}
        className={`flex-1 rounded-xl px-3 py-2.5 ${
          section === 'HISTORY' ? fill : 'bg-transparent'
        }`}>
        <Text
          className={`text-center text-sm font-bold ${
            section === 'HISTORY' ? 'text-white' : 'text-stone-700'
          }`}>
          {historyLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export type { BoardSection };
