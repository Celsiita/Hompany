import { ActivityIndicator, Text, View } from 'react-native';

import { mascotReaction } from '@/lib/mascot';
import { palette } from '@/lib/interactive-styles';

type MascotLoadingProps = {
  label?: string;
};

/**
 * Simple loading row with Mico copy (no illustrated face).
 */
export function MascotLoading({ label }: MascotLoadingProps) {
  return (
    <View className="items-center justify-center gap-2 py-6">
      <ActivityIndicator color={palette.brand} />
      <Text className="text-center text-sm text-stone-500">
        {label ?? mascotReaction('loading').body}
      </Text>
    </View>
  );
}
