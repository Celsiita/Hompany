import { View, Text } from 'react-native';

import type { AgendaDayDot } from '@/features/home/lib/agenda-items';

export type AgendaDayEmoji = {
  key: string;
  glyph: string;
};

type AgendaDayMarkersProps = {
  dots: AgendaDayDot[];
  emojis: AgendaDayEmoji[];
  showOthers?: boolean;
};

function dotClassName(dot: AgendaDayDot): string {
  if (dot.kind === 'expense') {
    return dot.open ? 'bg-amber-500' : 'bg-amber-300';
  }
  if (dot.kind === 'mine-task') {
    return dot.open ? 'bg-blue-600' : 'bg-blue-300';
  }
  if (dot.open) {
    return 'border border-sky-600 bg-transparent';
  }
  return 'border border-sky-300 bg-transparent';
}

/**
 * Task/expense dots under the day number (blue / sky / amber).
 */
export function AgendaDayMarkers({ dots, emojis, showOthers = true }: AgendaDayMarkersProps) {
  const visibleDots = dots.filter(
    (dot) => dot.kind !== 'absence' && (showOthers || dot.kind !== 'others-task'),
  );

  return (
    <View className="mt-0.5 items-center gap-0.5">
      <View className="h-1.5 flex-row items-center justify-center gap-0.5">
        {visibleDots.length === 0 ? (
          <View className="h-1.5 w-1" />
        ) : (
          visibleDots.map((dot) => (
            <View key={dot.key} className={`h-1.5 w-1.5 rounded-full ${dotClassName(dot)}`} />
          ))
        )}
      </View>
      {emojis.length > 0 ? (
        <View className="h-3 flex-row items-center justify-center gap-0.5">
          {emojis.map((emoji) => (
            <Text key={emoji.key} className="text-[9px] leading-3">
              {emoji.glyph}
            </Text>
          ))}
        </View>
      ) : (
        <View className="h-3" />
      )}
    </View>
  );
}
