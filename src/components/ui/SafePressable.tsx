import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { interactive, mergeStyles } from '@/lib/interactive-styles';

export type SafePressableProps = Omit<PressableProps, 'children' | 'className'> & {
  children?: ReactNode;
  /** Visual styles for the inner surface — use inline styles, not NativeWind className. */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Pressable without NativeWind css-interop (avoids navigation-context crashes on re-render).
 */
export function SafePressable({
  contentStyle,
  children,
  style,
  disabled,
  ...props
}: SafePressableProps) {
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
    <Pressable cssInterop={false} disabled={disabled} {...props} style={style}>
      {contentStyle || fillsParent ? (
        <View cssInterop={false} style={mergedContentStyle}>
          {children}
        </View>
      ) : (
        children
      )}
    </Pressable>
  );
}
