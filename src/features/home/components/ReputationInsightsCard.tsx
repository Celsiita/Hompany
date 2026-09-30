import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { HelpTip } from '@/components/ui/HelpTip';
import type { HomeLeaderboardRow } from '@/features/home/lib/leaderboard';

type ReputationInsightsCardProps = {
  rows: HomeLeaderboardRow[];
  currentUserId?: string | null;
  isPlus: boolean;
  onUnlock: () => void;
};

/**
 * Plus unlock: concrete ranking insights under the Feed leaderboard.
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
    <View className="gap-3 rounded-3xl border border-teal-200 bg-teal-50/60 p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-bold text-teal-950">Tu reputación · Plus</Text>
        <HelpTip
          title="Reputación Plus"
          message="Con Plus ves tu puesto, la distancia al primero y el resumen de la semana. Sirve de señal de confianza cuando busques piso o compañeros (Próximamente)."
        />
      </View>

      {!isPlus ? (
        <View className="gap-2">
          <Text className="text-sm leading-5 text-teal-900/80">
            Desbloquea tu resumen: puesto, gap al #1 y puntos por tareas. Así el ranking deja de ser
            solo una lista.
          </Text>
          <Button label="Desbloquear con Plus" onPress={onUnlock} />
        </View>
      ) : me ? (
        <Animated.View entering={ZoomIn.duration(280).springify().damping(14)} className="gap-1.5">
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
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn}>
          <Text className="text-sm text-teal-900/80">Aún no hay datos de reputación esta semana.</Text>
        </Animated.View>
      )}
    </View>
  );
}
