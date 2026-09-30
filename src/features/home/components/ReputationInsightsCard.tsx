import type { HomeLeaderboardRow } from '@/features/home/lib/leaderboard';
import { Button } from '@/components/ui/Button';
import { HelpTip } from '@/components/ui/HelpTip';
import { Text, View } from 'react-native';

type ReputationInsightsCardProps = {
  rows: HomeLeaderboardRow[];
  currentUserId?: string | null;
  isPlus: boolean;
  onUnlock: () => void;
};

/**
 * Plus insight card derived from the weekly leaderboard (no extra backend).
 */
export function ReputationInsightsCard({
  rows,
  currentUserId,
  isPlus,
  onUnlock,
}: ReputationInsightsCardProps) {
  const me = rows.find((row) => row.user_id === currentUserId) ?? null;
  const leader = rows[0] ?? null;
  const gap =
    me && leader && leader.user_id !== me.user_id
      ? Math.max(0, leader.reputation_points - me.reputation_points)
      : 0;

  return (
    <View className="gap-3 rounded-3xl border border-teal-200 bg-teal-50/50 p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-bold text-teal-950">Reputación Plus</Text>
        <HelpTip
          title="Reputación Plus"
          message="Con HOMPANY Plus ves tu puesto, la distancia al primero y un resumen de puntos ganados esta semana."
        />
      </View>

      {!isPlus ? (
        <View className="gap-2">
          <Text className="text-sm leading-5 text-teal-900/80">
            Desbloquea el resumen de reputación del piso.
          </Text>
          <Button label="Desbloquear con Plus" onPress={onUnlock} />
        </View>
      ) : me ? (
        <View className="gap-1.5">
          <Text className="text-2xl font-black tracking-tight text-teal-950">
            #{me.rank} · {me.reputation_points} pts
          </Text>
          <Text className="text-sm text-teal-900/80">
            {gap > 0
              ? `${gap} pts detrás de ${leader?.display_name ?? 'el primero'}`
              : rows.length > 1
                ? 'Vas en cabeza esta semana'
                : 'Solo tú en el ranking por ahora'}
          </Text>
          <Text className="text-xs text-teal-800/70">
            +{me.task_points_earned} pts por tareas · {me.tasks_completed} hechas ·{' '}
            {me.tasks_overdue} vencidas
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-teal-900/80">Aún no hay datos de reputación esta semana.</Text>
      )}
    </View>
  );
}
