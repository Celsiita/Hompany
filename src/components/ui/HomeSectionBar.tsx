import { Pressable, Text, View } from 'react-native';

export type HomeSection = 'FEED' | 'AGENDA' | 'PISO';

type HomeSectionBarProps = {
  section: HomeSection;
  onSectionChange: (value: HomeSection) => void;
};

const TABS: Array<{ id: HomeSection; label: string; hint: string }> = [
  { id: 'FEED', label: 'Feed', hint: 'Estado' },
  { id: 'AGENDA', label: 'Agenda', hint: 'Calendario' },
  { id: 'PISO', label: 'Piso', hint: 'Datos' },
];

/**
 * Switches Home between Feed, Agenda and practical flat info (pill segments).
 */
export function HomeSectionBar({ section, onSectionChange }: HomeSectionBarProps) {
  return (
    <View className="flex-row gap-2 rounded-2xl border border-stone-200 bg-white/80 p-1.5">
      {TABS.map((tab) => {
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
