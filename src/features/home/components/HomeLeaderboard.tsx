import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { MascotEmpty } from '@/components/ui/MascotEmpty';
import {
  formatLeaderboardTaskInfo,
  leaderboardInitial,
  type HomeLeaderboardRow,
} from '@/features/home/lib/leaderboard';

type HomeLeaderboardProps = {
  rows: HomeLeaderboardRow[];
  currentUserId?: string | null;
};

function rankTone(rank: number): { badge: string; text: string } {
  if (rank === 1) {
    return { badge: 'bg-amber-400', text: 'text-amber-950' };
  }
  if (rank === 2) {
    return { badge: 'bg-stone-300', text: 'text-stone-800' };
  }
  if (rank === 3) {
    return { badge: 'bg-orange-300', text: 'text-orange-950' };
  }
  return { badge: 'bg-stone-200', text: 'text-stone-700' };
}

const CARD_SHADOW = {
  shadowColor: '#1c1917',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/**
 * Feed card: ranked roommates with reputation score and task stats.
 */
export function HomeLeaderboard({ rows, currentUserId }: HomeLeaderboardProps) {
  if (rows.length === 0) {
    return <MascotEmpty kind="leaderboard" />;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(60).duration(320).springify().damping(18)}
      className="gap-2.5 rounded-3xl border border-stone-200/90 bg-white/95 p-4"
      style={CARD_SHADOW}>
      {rows.map((row) => {
        const isMe = Boolean(currentUserId && row.user_id === currentUserId);
        const isFirst = row.rank === 1;
        const tone = rankTone(row.rank);
        const initial = leaderboardInitial(row.display_name);

        return (
          <Animated.View
            key={row.user_id}
            entering={
              isMe && isFirst
                ? ZoomIn.delay(120).duration(320).springify().damping(12)
                : FadeInDown.delay(40 + row.rank * 30).duration(280)
            }
            className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${
              isMe
                ? 'border border-teal-300 bg-teal-50'
                : isFirst
                  ? 'border border-amber-200 bg-amber-50/70'
                  : 'bg-stone-50/90'
            }`}>
            <View className={`h-9 w-9 items-center justify-center rounded-full ${tone.badge}`}>
              <Text className={`text-sm font-bold ${tone.text}`}>{row.rank}</Text>
            </View>

            <View className="h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white">
              <Text className="text-base font-bold text-stone-800">{initial}</Text>
            </View>

            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-[15px] font-semibold text-stone-900" numberOfLines={1}>
                {row.display_name}
                {isMe ? (
                  <Text className="font-bold text-teal-700"> · tú</Text>
                ) : null}
              </Text>
              <Text className="text-[11px] leading-4 text-stone-500" numberOfLines={2}>
                {formatLeaderboardTaskInfo(row)}
              </Text>
            </View>

            <View className="items-end pl-1">
              <Text
                className={`text-2xl font-black tracking-tight ${
                  isMe ? 'text-teal-800' : 'text-stone-900'
                }`}>
                {row.reputation_points}
              </Text>
              <Text className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                pts
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}
