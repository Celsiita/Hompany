import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
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

  const baseClass = 'items-center justify-center rounded-xl px-4 py-3';
  const variantClass =
    variant === 'primary'
      ? 'bg-blue-600'
      : variant === 'secondary'
        ? 'bg-gray-100'
        : 'bg-transparent';

  const textClass =
    variant === 'primary' ? 'text-white font-semibold' : 'text-blue-700 font-semibold';

  return (
    <Pressable
      accessibilityRole="button"
      className={`${baseClass} ${variantClass} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      {...props}>
      <Text className={textClass}>{loading ? 'Espera…' : label}</Text>
    </Pressable>
  );
}
