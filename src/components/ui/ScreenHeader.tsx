import { Pressable, Text, View } from 'react-native';

import { OverflowMenuButton } from '@/components/ui/OverflowMenu';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
};

/**
 * In-screen title row. Tab native headers stay hidden to avoid duplicate titles.
 */
export function ScreenHeader({ title, subtitle, onMenuPress }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle ? <Text className="text-base text-gray-600">{subtitle}</Text> : null}
      </View>
      {onMenuPress ? <OverflowMenuButton onPress={onMenuPress} /> : null}
    </View>
  );
}
