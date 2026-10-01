import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useState } from 'react';

import { useLocale } from '@/providers/LocaleProvider';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  className?: string;
};

/**
 * Labeled text input with optional validation error and password visibility toggle.
 */
export function TextField({
  label,
  error,
  className,
  secureTextEntry,
  ...props
}: TextFieldProps) {
  const { t } = useLocale();
  const [hidden, setHidden] = useState(true);
  const isPassword = Boolean(secureTextEntry);
  const secure = isPassword ? hidden : false;

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-stone-700">{label}</Text>
      <View className="relative">
        <TextInput
          className={`rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-900 ${isPassword ? 'pr-12' : ''} ${className ?? ''}`}
          placeholderTextColor="#a8a29e"
          secureTextEntry={secure}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('a11y.showPassword') : t('a11y.hidePassword')}
            className="absolute right-3 top-3"
            hitSlop={8}>
            <Text className="text-sm font-semibold text-teal-700">{hidden ? '🙈' : '🐵'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
