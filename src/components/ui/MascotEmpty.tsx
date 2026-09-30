import { Text, View } from 'react-native';

import { mascotEmptyCopy, type MascotEmptyKind } from '@/lib/mascot';

type MascotEmptyProps = {
  kind: MascotEmptyKind;
  className?: string;
};

/**
 * Neutral empty state with soft card chrome for boards and inboxes.
 */
export function MascotEmpty({ kind, className }: MascotEmptyProps) {
  const copy = mascotEmptyCopy(kind);
  return (
    <View
      className={`items-center gap-1.5 rounded-2xl border border-stone-200 bg-white/80 py-8 px-4 ${className ?? ''}`}>
      <Text className="text-center text-base font-semibold text-stone-800">{copy.title}</Text>
      <Text className="text-center text-sm leading-5 text-stone-500">{copy.body}</Text>
    </View>
  );
}
