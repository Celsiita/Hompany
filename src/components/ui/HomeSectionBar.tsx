import { Pressable, Text, View } from 'react-native';

import { HelpTip } from '@/components/ui/HelpTip';

export type HomeSection = 'FEED' | 'AGENDA' | 'PISO';

type HomeSectionBarProps = {
  section: HomeSection;
  onSectionChange: (value: HomeSection) => void;
};

const TABS: Array<{ id: HomeSection; label: string }> = [
  { id: 'FEED', label: 'Feed' },
  { id: 'AGENDA', label: 'Agenda' },
  { id: 'PISO', label: 'Piso' },
];

/**
 * Switches Home between feed, agenda calendar and flat practical info.
 */
export function HomeSectionBar({ section, onSectionChange }: HomeSectionBarProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Secciones
        </Text>
        <HelpTip
          title="Inicio"
          message="Feed = estado y ranking. Agenda = calendario del día. Piso = Wi‑Fi, portal, reglas y quejas. Los avisos urgentes están en la campanita."
        />
      </View>
      <View className="flex-row gap-2">
        {TABS.map((tab) => {
          const active = section === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSectionChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`flex-1 rounded-xl px-2 py-2.5 ${
                active
                  ? 'border border-teal-300 bg-teal-50'
                  : 'border border-stone-200 bg-white/70'
              }`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  active ? 'text-teal-900' : 'text-stone-700'
                }`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
