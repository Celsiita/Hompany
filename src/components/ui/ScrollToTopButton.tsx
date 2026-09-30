import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

type ScrollToTopButtonProps = {
  visible: boolean;
  onPress: () => void;
};

/**
 * Floating control to jump back to the top of a long Agenda / board list.
 */
export function ScrollToTopButton({ visible, onPress }: ScrollToTopButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 12,
        bottom: 18,
        zIndex: 30,
      }}>
      <SafePressable
        onPress={onPress}
        accessibilityLabel="Subir arriba"
        accessibilityRole="button"
        contentStyle={mergeStyles(interactive.center, {
          height: 44,
          width: 44,
          borderRadius: 9999,
          backgroundColor: palette.brand,
          shadowColor: '#1c1917',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        })}>
        <Text style={{ color: palette.white, fontSize: 20, fontWeight: '700' }}>↑</Text>
      </SafePressable>
    </Animated.View>
  );
}

/** Show the scroll-to-top control after the user has scrolled past this offset. */
export const SCROLL_TO_TOP_THRESHOLD = 320;
