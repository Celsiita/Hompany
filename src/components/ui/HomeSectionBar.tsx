import { Pressable, Text, View } from 'react-native';

import { useLocale } from '@/providers/LocaleProvider';

export type HomeSection = 'FEED' | 'AGENDA';

type HomeSectionBarProps = {
  section: HomeSection;
  onSectionChange: (value: HomeSection) => void;
};

/**
 * Switches Home between Feed and Agenda (pill segments).
 */
export function HomeSectionBar({ section, onSectionChange }: HomeSectionBarProps) {
  const { t } = useLocale();
  const tabs: Array<{ id: HomeSection; label: string; hint: string }> = [
    { id: 'FEED', label: t('home.feed'), hint: t('home.feed.hint') },
    { id: 'AGENDA', label: t('home.agenda'), hint: t('home.agenda.hint') },
  ];

  return (
    <View className="flex-row gap-2 rounded-2xl border border-stone-200 bg-white/80 p-1.5">
      {tabs.map((tab) => {
        const active = section === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSectionChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-xl px-2 py-2.5 ${
              active ? 'bg-teal-700' : 'bg-transparent'
            }`}>
            <Text
              className={`text-sm font-bold ${active ? 'text-white' : 'text-stone-700'}`}>
              {tab.label}
            </Text>
            <Text
              className={`text-[10px] ${active ? 'text-teal-100' : 'text-stone-400'}`}>
              {tab.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
