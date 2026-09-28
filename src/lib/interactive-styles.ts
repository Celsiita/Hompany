import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/** Shared palette for touchable surfaces (no NativeWind className). */
export const palette = {
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue50: '#eff6ff',
  blue400: '#60a5fa',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray700: '#374151',
  white: '#ffffff',
  violet100: 'rgba(237, 233, 254, 0.6)',
  violet200: 'rgba(221, 214, 254, 0.5)',
  violet300: 'rgba(196, 181, 253, 0.7)',
  violet400: 'rgba(167, 139, 250, 0.35)',
  violet500: '#8b5cf6',
  amber100: 'rgba(254, 243, 199, 0.6)',
  amber200: 'rgba(253, 230, 138, 0.5)',
  amber300: 'rgba(252, 211, 77, 0.7)',
  amber400: 'rgba(251, 191, 36, 0.35)',
  amber500: '#f59e0b',
  emerald50: '#ecfdf5',
  emerald400: '#34d399',
} as const;

export const interactive = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch', width: '100%' },
  roundedXl: { borderRadius: 12 },
  roundedLg: { borderRadius: 8 },
  roundedFull: { borderRadius: 9999 },
  center: { alignItems: 'center', justifyContent: 'center' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: palette.blue600,
  },
  chipInactive: {
    backgroundColor: palette.gray100,
  },
  pill: {
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: palette.blue600,
  },
  pillInactive: {
    backgroundColor: palette.gray100,
  },
  borderedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.gray200,
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  borderedCardActive: {
    borderColor: palette.blue400,
    backgroundColor: palette.blue50,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.blue600,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.gray100,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
});

export function mergeStyles(
  ...styles: Array<ViewStyle | TextStyle | false | null | undefined>
): ViewStyle {
  return Object.assign({}, ...styles.filter(Boolean)) as ViewStyle;
}
