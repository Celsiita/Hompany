import { Image, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { categoryLabel } from '@/features/tasks/components/TaskFilterBar';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import { isPausedRecurring, recurrenceLabel } from '@/features/tasks/lib/recurrence';
import { glyphForTaskIcon } from '@/lib/icons/packs';
import { formatHistoryDateTime } from '@/lib/recurrence';
import { taskStatusBadge } from '@/lib/status-badges';
import { useIconPack } from '@/providers/IconPackProvider';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

type TaskCardProps = {
  task: TaskWithRelations;
  busy?: boolean;
  showDate?: boolean;
  canEdit?: boolean;
  /** Temporary visual focus from calendar / create redirect. */
  highlighted?: boolean;
  onEdit?: (task: TaskWithRelations) => void;
  onSubmitProof?: (task: TaskWithRelations) => void;
  onApprove?: (task: TaskWithRelations) => void;
  onDispute?: (task: TaskWithRelations) => void;
  onRepeat?: (task: TaskWithRelations) => void;
  onReopen?: (task: TaskWithRelations) => void;
  onRequestSwap?: (task: TaskWithRelations) => void;
};

/**
 * Interactive task card with assignees, countdown and quick actions.
 */
export function TaskCard({
  task,
  busy = false,
  showDate = false,
  canEdit = true,
  highlighted = false,
  onEdit,
  onSubmitProof,
  onApprove,
  onDispute,
  onRepeat,
  onReopen,
  onRequestSwap,
}: TaskCardProps) {
  const { pack } = useIconPack();
  const dueSummary = formatDueSummary(task.due_at, task.due_mode ?? 'DEADLINE');
  const showSubmit = task.status === TASK_STATUS.PENDING && onSubmitProof && !isPausedRecurring(task);
  const showReview = task.status === TASK_STATUS.SUBMITTED && (onApprove || onDispute);
  const closed =
    task.status === TASK_STATUS.COMPLETED ||
    task.status === TASK_STATUS.RESOLVED_LATE ||
    task.status === TASK_STATUS.RESOLVED_BY_PEER ||
    task.status === TASK_STATUS.SKIPPED;
  const badge = taskStatusBadge(task.status, { paused: isPausedRecurring(task) });
  const completedAt = task.completed_at ?? (closed ? task.updated_at : null);

  return (
    <View
      className={`rounded-2xl border bg-white p-4 gap-3 ${
        highlighted ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Text className="text-xl">{glyphForTaskIcon(pack, task.icon)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold text-gray-900">{task.title}</Text>
            <Text className="text-xs font-medium text-blue-700">
              {categoryLabel(task.category)} · {recurrenceLabel(task.recurrence)}
            </Text>
            {task.description ? (
              <Text className="text-sm text-gray-600">{task.description}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge tone={badge} />
      </View>

      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 gap-1">
          {task.task_assignees.length === 0 ? (
            <Text className="text-xs text-gray-500">Sin asignar</Text>
          ) : (
            task.task_assignees.slice(0, 4).map((assignee) => (
              <Text key={assignee.id} className="text-sm text-gray-800">
                {assignee.profiles?.display_name ?? 'Compañero'}
              </Text>
            ))
          )}
        </View>
        <Text className="text-sm text-gray-500">{task.points_value} pts</Text>
      </View>

      {showDate ? (
        <View className="gap-0.5">
          <Text className="text-sm text-gray-600">
            Programada: {formatHistoryDateTime(task.due_at)}
          </Text>
          <Text className="text-sm text-gray-600">
            Realización:{' '}
            {completedAt ? formatHistoryDateTime(completedAt) : '—'}
          </Text>
        </View>
      ) : (
        <Text
          className={`text-sm font-medium ${dueSummary.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
          {dueSummary.label}
        </Text>
      )}

      {task.proof_image_url && task.status === TASK_STATUS.SUBMITTED ? (
        <Image
          source={{ uri: task.proof_image_url }}
          className="h-40 w-full rounded-xl bg-gray-100"
          resizeMode="cover"
        />
      ) : null}

      {task.status === TASK_STATUS.SUBMITTED && !onApprove && !onDispute ? (
        <Text className="text-sm text-sky-800">
          En revisión. Esperando a que un compañero la valide
          {task.proof_image_url ? ' (con foto).' : '.'}
        </Text>
      ) : null}

      {showSubmit ? (
        <Button
          label="Completar"
          loading={busy}
          onPress={() => onSubmitProof?.(task)}
        />
      ) : null}

      {showReview ? (
        <View className="flex-row gap-2">
          {onApprove ? (
            <View className="flex-1">
              <Button label="👏 Aprobar" loading={busy} onPress={() => onApprove(task)} />
            </View>
          ) : null}
          {onDispute ? (
            <View className="flex-1">
              <Button
                label="Impugnar"
                variant="secondary"
                loading={busy}
                onPress={() => onDispute(task)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {onRepeat || onReopen ? (
        <View className="flex-row gap-2">
          {onRepeat ? (
            <View className="flex-1">
              <Button label="↻ Repetir" variant="secondary" loading={busy} onPress={() => onRepeat(task)} />
            </View>
          ) : null}
          {onReopen ? (
            <View className="flex-1">
              <Button label="Reabrir" loading={busy} onPress={() => onReopen(task)} />
            </View>
          ) : null}
        </View>
      ) : null}

      {onRequestSwap && !closed ? (
        <Button
          label="⇄ Intercambiar"
          variant="secondary"
          loading={busy}
          onPress={() => onRequestSwap(task)}
        />
      ) : null}

      <View className="flex-row flex-wrap gap-3">
        {canEdit && onEdit && !closed ? (
          <Pressable onPress={() => onEdit(task)}>
            <Text className="text-sm font-semibold text-blue-700">Editar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
