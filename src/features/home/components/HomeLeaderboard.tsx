import { Text, View } from 'react-native';

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
    return { badge: 'bg-slate-300', text: 'text-slate-800' };
  }
  if (rank === 3) {
    return { badge: 'bg-orange-300', text: 'text-orange-950' };
  }
  return { badge: 'bg-gray-200', text: 'text-gray-700' };
}

/**
 * Feed card: ranked roommates with reputation score and task stats.
 */
export function HomeLeaderboard({ rows, currentUserId }: HomeLeaderboardProps) {
  if (rows.length === 0) {
    return (
      <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-2">
        <Text className="text-sm font-semibold text-gray-900">Clasificación</Text>
        <Text className="text-sm text-gray-500">Aún no hay compañeros en el piso.</Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-gray-900">Clasificación</Text>
        <Text className="text-xs text-gray-500">Puntos de reputación y tareas del piso</Text>
      </View>

      <View className="gap-2">
        {rows.map((row) => {
          const isMe = Boolean(currentUserId && row.user_id === currentUserId);
          const tone = rankTone(row.rank);
          const initial = leaderboardInitial(row.display_name);

          return (
            <View
              key={row.user_id}
              className={`flex-row items-center gap-3 rounded-xl px-3 py-2.5 ${
                isMe ? 'border border-blue-200 bg-blue-50' : 'bg-gray-50'
              }`}>
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${tone.badge}`}>
                <Text className={`text-xs font-bold ${tone.text}`}>{row.rank}</Text>
              </View>

              <View className="h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200">
                <Text className="text-sm font-bold text-gray-800">{initial}</Text>
              </View>

              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                  {row.display_name}
                  {isMe ? ' · tú' : ''}
                </Text>
                <Text className="text-[11px] text-gray-500" numberOfLines={2}>
                  {formatLeaderboardTaskInfo(row)}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-lg font-bold text-gray-900">{row.reputation_points}</Text>
                <Text className="text-[10px] uppercase tracking-wide text-gray-500">pts</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
