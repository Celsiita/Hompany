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
    <View className="flex-row gap-2.5 pt-1">
      <View className="mt-0.5 w-1 self-stretch rounded-full bg-teal-600" />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-stone-900">{title}</Text>
        {subtitle ? <Text className="text-xs leading-4 text-stone-500">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
