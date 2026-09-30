import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HeaderAlertsButton } from '@/components/ui/HeaderAlertsButton';
import { HelpTip } from '@/components/ui/HelpTip';
import { OverflowMenuButton } from '@/components/ui/OverflowMenu';

type CreateAccent = 'blue' | 'amber' | 'teal';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  /** Opens the in-app alerts inbox. */
  onAlertsPress?: () => void;
  alertsCount?: number;
  urgentAlertsCount?: number;
  helpTitle?: string;
  helpMessage?: string;
  /** Primary create action (preferred over overflow ⋮ for new items). */
  onCreatePress?: () => void;
  createAccessibilityLabel?: string;
  /** Semantic + button: tasks blue, expenses amber, brand teal. */
  createAccent?: CreateAccent;
  /** Extra controls before alerts / create (e.g. matching teaser). */
  headerEnd?: ReactNode;
};

const CREATE_ACCENT_CLASS: Record<CreateAccent, string> = {
  blue: 'bg-blue-700',
  amber: 'bg-amber-600',
  teal: 'bg-teal-700',
};

/**
 * In-screen title row. Tab native headers stay hidden to avoid duplicate titles.
 */
export function ScreenHeader({
  title,
  subtitle,
  onMenuPress,
  onAlertsPress,
  alertsCount = 0,
  urgentAlertsCount = 0,
  helpTitle,
  helpMessage,
  onCreatePress,
  createAccessibilityLabel = 'Crear',
  createAccent = 'teal',
  headerEnd,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-stone-900">{title}</Text>
          {helpTitle && helpMessage ? (
            <HelpTip title={helpTitle} message={helpMessage} />
          ) : null}
        </View>
        {subtitle ? <Text className="text-sm leading-5 text-stone-600">{subtitle}</Text> : null}
      </View>
      <View className="flex-row items-center gap-2">
        {headerEnd}
        {onAlertsPress ? (
          <HeaderAlertsButton
            count={alertsCount}
            urgentCount={urgentAlertsCount}
            onPress={onAlertsPress}
          />
        ) : null}
        {onCreatePress ? (
          <Pressable
            onPress={onCreatePress}
            accessibilityRole="button"
            accessibilityLabel={createAccessibilityLabel}
            className={`h-11 w-11 items-center justify-center rounded-xl ${CREATE_ACCENT_CLASS[createAccent]}`}>
            <Text className="text-2xl font-bold leading-none text-white">+</Text>
          </Pressable>
        ) : null}
        {onMenuPress ? <OverflowMenuButton onPress={onMenuPress} /> : null}
      </View>
    </View>
  );
}
