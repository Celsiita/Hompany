import { Pressable, Text, View } from 'react-native';

export type HomeSection = 'FEED' | 'AGENDA';

type HomeSectionBarProps = {
  section: HomeSection;
  onSectionChange: (value: HomeSection) => void;
};

/**
 * Switches Home between the activity feed and temporal agenda views.
 */
export function HomeSectionBar({ section, onSectionChange }: HomeSectionBarProps) {
  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => onSectionChange('FEED')}
        accessibilityRole="tab"
        accessibilityState={{ selected: section === 'FEED' }}
        className={`flex-1 rounded-xl px-3 py-2 ${
          section === 'FEED'
            ? 'border border-teal-300 bg-teal-50'
            : 'border border-stone-200 bg-white/70'
        }`}>
        <Text className="text-center text-sm font-semibold text-stone-800">Feed</Text>
      </Pressable>
      <Pressable
        onPress={() => onSectionChange('AGENDA')}
        accessibilityRole="tab"
        accessibilityState={{ selected: section === 'AGENDA' }}
        className={`flex-1 rounded-xl px-3 py-2 ${
          section === 'AGENDA'
            ? 'border border-teal-300 bg-teal-50'
            : 'border border-stone-200 bg-white/70'
        }`}>
        <Text className="text-center text-sm font-semibold text-stone-800">Agenda</Text>
      </Pressable>
    </View>
  );
}
