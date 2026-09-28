import { Text, View } from 'react-native';

import { mascotEmptyCopy, type MascotEmptyKind } from '@/lib/mascot';

type MascotEmptyProps = {
  kind: MascotEmptyKind;
  className?: string;
};

/**
 * Neutral empty state (no mascot chrome in boards).
 */
export function MascotEmpty({ kind, className }: MascotEmptyProps) {
  const copy = mascotEmptyCopy(kind);
  return (
    <View className={`items-center gap-1 py-8 px-4 ${className ?? ''}`}>
      <Text className="text-center text-base font-semibold text-gray-800">{copy.title}</Text>
      <Text className="text-center text-sm text-gray-500">{copy.body}</Text>
    </View>
  );
}
