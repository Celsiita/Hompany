import { Platform, type ViewStyle } from 'react-native';

/** Small elevation shadow — use as inline style instead of `shadow-sm` on Pressable. */
export const shadowSm: ViewStyle =
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {};
