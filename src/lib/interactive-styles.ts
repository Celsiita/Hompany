import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Brand palette — warm flat / teal accent (Shipaton visual pass).
 * Avoid generic purple-on-white AI look; keep semantic green/amber/red for health.
 */
export const palette = {
  brand: '#0f766e',
  brandDark: '#0d5c56',
  brandSoft: '#ccfbf1',
  brandMuted: '#99f6e4',
  cream: '#f7f4ef',
  creamDeep: '#efe8df',
  ink: '#1c1917',
  inkMuted: '#57534e',
  blue600: '#0f766e',
  blue700: '#0d5c56',
  blue50: '#f0fdfa',
  blue400: '#2dd4bf',
  gray50: '#fafaf9',
  gray100: '#f5f5f4',
  gray200: '#e7e5e4',
  gray700: '#44403c',
  white: '#ffffff',
  violet100: 'rgba(204, 251, 241, 0.55)',
  violet200: 'rgba(153, 246, 228, 0.45)',
  violet300: 'rgba(94, 234, 212, 0.55)',
  violet400: 'rgba(45, 212, 191, 0.3)',
  violet500: '#0f766e',
  amber100: 'rgba(254, 243, 199, 0.6)',
  amber200: 'rgba(253, 230, 138, 0.5)',
  amber300: 'rgba(252, 211, 77, 0.7)',
  amber400: 'rgba(251, 191, 36, 0.35)',
  amber500: '#f59e0b',
  emerald50: '#ecfdf5',
  emerald400: '#34d399',
  coral: '#e07a5f',
  coralSoft: '#fce8e2',
  amber50: '#fffbeb',
  amber600: '#d97706',
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
    backgroundColor: palette.brand,
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
    backgroundColor: palette.brand,
  },
  pillInactive: {
    backgroundColor: palette.gray100,
  },
  borderedCard: {
    borderRadius: 14,
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
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: palette.brand,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: palette.gray100,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
});

export function mergeStyles(
  ...styles: Array<ViewStyle | TextStyle | false | null | undefined>
): ViewStyle {
  return Object.assign({}, ...styles.filter(Boolean)) as ViewStyle;
}
