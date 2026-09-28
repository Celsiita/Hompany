import { Pressable, Text, View } from 'react-native';

import { OverflowMenuButton } from '@/components/ui/OverflowMenu';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  /** Primary create action (preferred over overflow ⋮ for new items). */
  onCreatePress?: () => void;
  createAccessibilityLabel?: string;
};

/**
 * In-screen title row. Tab native headers stay hidden to avoid duplicate titles.
 */
export function ScreenHeader({
  title,
  subtitle,
  onMenuPress,
  onCreatePress,
  createAccessibilityLabel = 'Crear',
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle ? <Text className="text-base text-gray-600">{subtitle}</Text> : null}
      </View>
      <View className="flex-row items-center gap-2">
        {onCreatePress ? (
          <Pressable
            onPress={onCreatePress}
            accessibilityRole="button"
            accessibilityLabel={createAccessibilityLabel}
            className="h-11 w-11 items-center justify-center rounded-full bg-blue-600">
            <Text className="text-2xl font-bold leading-none text-white">+</Text>
          </Pressable>
        ) : null}
        {onMenuPress ? <OverflowMenuButton onPress={onMenuPress} /> : null}
      </View>
    </View>
  );
}
