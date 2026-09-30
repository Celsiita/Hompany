import { Text, View } from 'react-native';

type FeedSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

/**
 * Clear section label inside the Home Feed scroll.
 */
export function FeedSectionHeader({ title, subtitle }: FeedSectionHeaderProps) {
  return (
    <View className="gap-0.5 pt-1">
      <Text className="text-sm font-bold uppercase tracking-wide text-stone-500">{title}</Text>
      {subtitle ? <Text className="text-xs text-stone-500">{subtitle}</Text> : null}
    </View>
  );
}
