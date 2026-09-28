import { Alert, Pressable, Text } from 'react-native';

type InfoTipProps = {
  title: string;
  message: string;
  tone?: 'violet' | 'amber' | 'gray';
};

const TONE_CLASS = {
  violet: 'text-violet-700',
  amber: 'text-amber-800',
  gray: 'text-gray-500',
} as const;

/**
 * Compact info icon that opens a native alert with explanatory copy.
 */
export function InfoTip({ title, message, tone = 'gray' }: InfoTipProps) {
  return (
    <Pressable
      onPress={() => Alert.alert(title, message)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Información sobre ${title}`}>
      <Text className={`text-sm font-bold ${TONE_CLASS[tone]}`}>ⓘ</Text>
    </Pressable>
  );
}
