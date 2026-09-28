import { Text, type PressableProps, type TextStyle } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

const labelStyles: Record<NonNullable<ButtonProps['variant']>, TextStyle> = {
  primary: { color: palette.white, fontWeight: '600' },
  secondary: { color: palette.blue700, fontWeight: '600' },
  ghost: { color: palette.blue700, fontWeight: '600' },
};

/**
 * Primary action button used across auth and onboarding screens.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const surface =
    variant === 'primary'
      ? interactive.primaryButton
      : variant === 'secondary'
        ? interactive.secondaryButton
        : interactive.ghostButton;

  return (
    <SafePressable
      accessibilityRole="button"
      contentStyle={mergeStyles(surface, isDisabled ? interactive.disabled : undefined)}
      disabled={isDisabled}
      {...props}>
      <Text style={labelStyles[variant]}>{loading ? 'Espera…' : label}</Text>
    </SafePressable>
  );
}
