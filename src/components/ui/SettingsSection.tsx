import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: 'default' | 'plus' | 'danger';
};

const TONE = {
  default: 'border-stone-200 bg-white',
  plus: 'border-teal-200 bg-teal-50/80',
  danger: 'border-rose-200 bg-rose-50/50',
} as const;

/**
 * Grouped card for Settings — one job per block, scannable titles.
 */
export function SettingsSection({
  title,
  subtitle,
  children,
  tone = 'default',
}: SettingsSectionProps) {
  return (
    <View className={`gap-3 rounded-2xl border p-4 ${TONE[tone]}`}>
      <View className="gap-0.5">
        <Text
          className={`text-sm font-bold uppercase tracking-wide ${
            tone === 'plus' ? 'text-teal-800' : tone === 'danger' ? 'text-rose-800' : 'text-stone-500'
          }`}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={`text-xs leading-4 ${
              tone === 'plus' ? 'text-teal-900/75' : 'text-stone-500'
            }`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
