import { Image, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { categoryLabel } from '@/features/tasks/components/TaskFilterBar';
import { awardedTaskPoints, canRequestTaskSwap, isTaskOpenOverdue } from '@/features/tasks/lib/board-filters';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import { isPausedRecurring, recurrenceLabel } from '@/features/tasks/lib/recurrence';
import { taskOwnershipLabel } from '@/features/tasks/lib/task-ownership';
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
  currentUserId?: string | null;
  /** Temporary visual focus from calendar / create redirect. */
  highlighted?: boolean;
  onEdit?: (task: TaskWithRelations) => void;
  onSubmitProof?: (task: TaskWithRelations) => void;
  onApprove?: (task: TaskWithRelations) => void;
  onDispute?: (task: TaskWithRelations) => void;
  onRepeat?: (task: TaskWithRelations) => void;
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
  currentUserId,
  highlighted = false,
  onEdit,
  onSubmitProof,
  onApprove,
  onDispute,
  onRepeat,
  onRequestSwap,
}: TaskCardProps) {
  const { pack } = useIconPack();
  const ownershipLabel = taskOwnershipLabel(
    task.task_assignees.map((assignee) => assignee.user_id),
    currentUserId,
  );
  const mine = ownershipLabel === 'Tuya';
  const dueSummary = formatDueSummary(task.due_at, task.due_mode ?? 'DEADLINE');
  const showSubmit =
    (task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.OVERDUE) &&
    onSubmitProof &&
    !isPausedRecurring(task);
  const showReview = task.status === TASK_STATUS.SUBMITTED && (onApprove || onDispute);
  const closed =
    task.status === TASK_STATUS.COMPLETED ||
    task.status === TASK_STATUS.RESOLVED_LATE ||
    task.status === TASK_STATUS.RESOLVED_BY_PEER ||
    task.status === TASK_STATUS.SKIPPED;
  const showSwap = Boolean(onRequestSwap && canRequestTaskSwap(task));
  const badge = taskStatusBadge(task.status, {
    paused: isPausedRecurring(task),
    openOverdue: isTaskOpenOverdue(task),
  });
  const completedAt = task.completed_at ?? (closed ? task.updated_at : null);
  const editable = Boolean(canEdit && onEdit);
  const pointsShown = awardedTaskPoints(task);
  const pointsPenalized =
    task.status === TASK_STATUS.RESOLVED_LATE && pointsShown < task.points_value;
  const disputeNote =
    task.review_note_kind === 'DISPUTE' && task.review_note?.trim()
      ? task.review_note.trim()
      : null;
  const approveNote =
    task.review_note_kind === 'APPROVE' && task.review_note?.trim() && closed
      ? task.review_note.trim()
      : null;

  return (
    <Pressable
      disabled={!editable}
      onPress={() => onEdit?.(task)}
      accessibilityRole={editable ? 'button' : undefined}
      accessibilityHint={editable ? 'Editar tarea' : undefined}
      className={`rounded-2xl border bg-white p-4 gap-3 ${
        highlighted
          ? 'border-blue-400 bg-blue-50'
          : mine
            ? 'border-blue-200'
            : 'border-stone-200'
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Text className="text-xl">{glyphForTaskIcon(pack, task.icon)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row flex-wrap items-center gap-1.5">
              {ownershipLabel ? (
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    mine ? 'bg-blue-200/80' : 'bg-sky-200/80'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold ${
                      mine ? 'text-blue-950' : 'text-sky-950'
                    }`}>
                    {ownershipLabel}
                  </Text>
                </View>
              ) : null}
              <Text className="text-xs font-medium text-blue-700">
                {categoryLabel(task.category)} · {recurrenceLabel(task.recurrence)}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-stone-900">{task.title}</Text>
            {task.description ? (
              <Text className="text-sm text-stone-600">{task.description}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge tone={badge} />
      </View>

      {disputeNote && !closed ? (
        <View className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 gap-0.5">
          <Text className="text-xs font-bold uppercase tracking-wide text-amber-900">
            Requiere revisión
          </Text>
          <Text className="text-sm text-amber-950">motivo: {disputeNote}</Text>
        </View>
      ) : null}

      {approveNote ? (
        <View className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Text className="text-xs font-semibold text-emerald-800">Sugerencia al validar</Text>
          <Text className="text-sm text-emerald-950">{approveNote}</Text>
        </View>
      ) : null}

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
        <Text className="text-sm text-gray-500">
          {pointsPenalized ? `${pointsShown} pts (mitad)` : `${pointsShown} pts`}
        </Text>
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
        <Button label="Completar" loading={busy} onPress={() => onSubmitProof?.(task)} />
      ) : null}

      {showReview ? (
        <View className="flex-row gap-2">
          {onApprove ? (
            <View className="flex-1">
              <Button label="Aprobar" loading={busy} onPress={() => onApprove(task)} />
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

      {onRepeat ? (
        <Button
          label="↻ Repetir"
          variant="secondary"
          loading={busy}
          onPress={() => onRepeat(task)}
        />
      ) : null}

      {showSwap ? (
        <Button
          label="⇄ Intercambiar"
          variant="secondary"
          loading={busy}
          onPress={() => onRequestSwap?.(task)}
        />
      ) : null}
    </Pressable>
  );
}
