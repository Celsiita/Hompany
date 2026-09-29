import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { interactive } from '@/lib/interactive-styles';

export type SafePressableProps = Omit<PressableProps, 'children' | 'className'> & {
  children?: ReactNode;
  /** Visual styles for the inner surface — use inline styles, not NativeWind className. */
  contentStyle?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable without NativeWind css-interop (avoids navigation-context crashes on re-render).
 * Applies a light scale feedback on press.
 */
export function SafePressable({
  contentStyle,
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: SafePressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flatStyle = typeof style === 'function' ? undefined : StyleSheet.flatten(style);
  const fillsParent =
    flatStyle?.flex === 1 ||
    flatStyle?.width !== undefined ||
    flatStyle?.height !== undefined ||
    flatStyle?.alignSelf === 'stretch';

  const mergedContentStyle: StyleProp<ViewStyle> = fillsParent
    ? [interactive.fill, contentStyle]
    : contentStyle;

  return (
    <AnimatedPressable
      cssInterop={false}
      disabled={disabled}
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        scale.value = withTiming(0.97, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(event);
      }}>
      {contentStyle || fillsParent ? (
        <View cssInterop={false} style={mergedContentStyle}>
          {children}
        </View>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}
