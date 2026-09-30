import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type FlatList as FlatListType,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BoardSectionBar, type BoardSection } from '@/components/ui/BoardSectionBar';
import { CollapsibleFilterPanel } from '@/components/ui/CollapsibleFilterPanel';
import { Button } from '@/components/ui/Button';
import { MascotEmpty } from '@/components/ui/MascotEmpty';
import { MascotLoading } from '@/components/ui/MascotLoading';
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ProofSourceModal } from '@/features/tasks/components/ProofSourceModal';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskFilterBar } from '@/features/tasks/components/TaskFilterBar';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { TaskReviewCommentModal } from '@/features/tasks/components/TaskReviewCommentModal';
import { useHomeAbsences } from '@/features/home/hooks/useHomeAbsences';
import { useHomeExamPeriods } from '@/features/home/hooks/useHomeExamPeriods';
import { useHomeItemTypes } from '@/features/home/hooks/useHomeItemTypes';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
import { canRequestTaskSwap } from '@/features/tasks/lib/board-filters';
import { mascotScreenLine } from '@/lib/mascot';
import {
  canViewerParticipateInTasks,
  isViewerAbsentOnDate,
} from '@/features/tasks/lib/absence-task-rules';
import { examSilenceWarning, shouldWarnExamSilence } from '@/lib/exam-periods';
import { useBoardItemFocus } from '@/hooks/useBoardItemFocus';
import { parseFocusId } from '@/lib/navigation/board-focus';
import { formatHistoryDate } from '@/lib/recurrence';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import type { UpsertTaskInput } from '@/schemas/task.schema';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

/**
 * Task board — personal vs roommate scope, category chips, proof and reviews.
 */
export function TasksScreen() {
  const { user } = useAuth();
  const { activeHome } = useHome();
  const confirm = useConfirmDialog();
  const router = useRouter();
  const params = useLocalSearchParams<{ focusId?: string | string[] }>();
  const routeFocusId = parseFocusId(params.focusId);
  const listRef = useRef<FlatListType<TaskWithRelations>>(null);
  const {
    tasks,
    filteredOpenTasks,
    filteredClosedTasks,
    activityEvents,
    swapRequests,
    members,
    isAdmin,
    isLoading,
    error,
    refresh,
    addTask,
    editTask,
    removeTask,
    repeatTask,
    requestSwap,
    answerSwap,
    submitProof,
    reviewTask,
    categoryFilter,
    setCategoryFilter,
    assigneeScope,
    setAssigneeScope,
    recurrenceFilter,
    setRecurrenceFilter,
    statusFilter,
    setStatusFilter,
  } = useHomeTasks();
  const { absences } = useHomeAbsences();
  const { examPeriods } = useHomeExamPeriods();
  const { types: taskTypes, addType: addTaskType } = useHomeItemTypes('task');

  const [section, setSection] = useState<BoardSection>('ACTIVE');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'repeat'>('create');
  const [formTask, setFormTask] = useState<TaskWithRelations | null>(null);
  const [proofTask, setProofTask] = useState<TaskWithRelations | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    task: TaskWithRelations;
    mode: 'APPROVE' | 'DISPUTE';
  } | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [swapTask, setSwapTask] = useState<TaskWithRelations | null>(null);

  const findTask = useCallback((id: string) => tasks.find((task) => task.id === id), [tasks]);

  const onFocusTask = useCallback(
    (task: TaskWithRelations) => {
      const closed =
        task.status === TASK_STATUS.COMPLETED ||
        task.status === TASK_STATUS.RESOLVED_LATE ||
        task.status === TASK_STATUS.RESOLVED_BY_PEER ||
        task.status === TASK_STATUS.SKIPPED;
      setSection(closed ? 'HISTORY' : 'ACTIVE');
      setCategoryFilter('ALL');
      setAssigneeScope('ALL');
      setRecurrenceFilter('ALL');
      setStatusFilter('ALL');
      setFormVisible(false);
      setFormTask(null);
      setFormMode('create');
    },
    [setCategoryFilter, setAssigneeScope, setRecurrenceFilter, setStatusFilter],
  );

  const clearRouteParam = useCallback(() => {
    router.setParams({ focusId: undefined });
  }, [router]);

  const { highlightedId, requestFocus } = useBoardItemFocus({
    routeFocusId,
    isLoading,
    findItem: findTask,
    onFocus: onFocusTask,
    clearRouteParam,
  });

  const activeFilterCount = [
    assigneeScope !== 'ALL',
    categoryFilter !== 'ALL',
    recurrenceFilter !== 'ALL',
    statusFilter !== 'ALL',
  ].filter(Boolean).length;

  const filterHint =
    activeFilterCount > 0
      ? `${activeFilterCount} activo${activeFilterCount === 1 ? '' : 's'}`
      : null;

  const isHistory = section === 'HISTORY';
  const listData = isHistory ? filteredClosedTasks : filteredOpenTasks;

  useEffect(() => {
    if (!highlightedId) {
      return;
    }
    const index = listData.findIndex((item) => item.id === highlightedId);
    if (index < 0) {
      return;
    }
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
    }, 120);
    return () => clearTimeout(timer);
  }, [highlightedId, listData]);

  async function runTaskAction(taskId: string, action: () => Promise<void>) {
    setActionError(null);
    setBusyTaskId(taskId);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setBusyTaskId(null);
    }
  }

  function isAssigneeOf(task: TaskWithRelations): boolean {
    if (!user) {
      return false;
    }
    return (
      task.assigned_to === user.id ||
      task.task_assignees.some((assignee) => assignee.user_id === user.id)
    );
  }

  function taskAssigneeId(task: TaskWithRelations): string | null {
    return task.assigned_to ?? task.task_assignees[0]?.user_id ?? null;
  }

  async function disputeTaskWithSilenceCheck(task: TaskWithRelations) {
    const assigneeId = taskAssigneeId(task);
    if (
      assigneeId &&
      shouldWarnExamSilence({
        actorUserId: user?.id,
        targetUserId: assigneeId,
        periods: examPeriods,
      })
    ) {
      const name =
        members.find((member) => member.user_id === assigneeId)?.profiles?.display_name ??
        'Compañero';
      const ok = await confirm({
        title: 'Modo silencio',
        message: `${examSilenceWarning(name)}. ¿Impugnar igualmente?`,
        confirmLabel: 'Continuar',
      });
      if (!ok) {
        return;
      }
    }
    setReviewTarget({ task, mode: 'DISPUTE' });
  }

  async function confirmDelete(task: TaskWithRelations) {
    const ok = await confirm({
      title: 'Eliminar tarea',
      message: `¿Borrar «${task.title}»? El historial de movimientos se conserva.`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    await runTaskAction(task.id, () => removeTask(task.id));
  }

  function proposeSwap(task: TaskWithRelations) {
    if (!canRequestTaskSwap(task)) {
      setActionError('No se puede intercambiar una tarea ya completada o en revisión.');
      return;
    }
    const others = members.filter((member) => member.user_id !== user?.id);
    if (others.length === 0) {
      setActionError('No hay compañeros para intercambiar.');
      return;
    }
    setSwapTask(task);
  }

  const incomingSwaps = swapRequests.filter(
    (item) =>
      item.to_user_id === user?.id && canViewerParticipateInTasks(absences, user?.id),
  );

  const viewerAbsentToday = !canViewerParticipateInTasks(absences, user?.id);

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(240)} className="flex-1">
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.id}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
          }, 250);
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />
        }
        ListHeaderComponent={
          <View className="gap-4 mb-4 pt-2">
            <ScreenHeader
              title="Tareas"
              subtitle={mascotScreenLine('tasks')}
              helpTitle="Tareas"
              helpMessage="Crea con +. Entrega con foto si el piso lo pide. Los compañeros aprueban o impugnan. En pendientes: «Proponer cambio». Lo cerrado no se reabre."
              onCreatePress={() => {
                setFormTask(null);
                setFormMode('create');
                setFormVisible(true);
              }}
              createAccessibilityLabel="Nueva tarea"
            />

            <BoardSectionBar
              section={section}
              onSectionChange={setSection}
              activeLabel={`En curso (${filteredOpenTasks.length})`}
              historyLabel={`Historial (${filteredClosedTasks.length})`}
              accent="blue"
            />

            <CollapsibleFilterPanel activeHint={filterHint}>
              <TaskFilterBar
                category={categoryFilter}
                onCategoryChange={setCategoryFilter}
                customTypes={taskTypes}
                scope={assigneeScope}
                onScopeChange={setAssigneeScope}
                recurrence={recurrenceFilter}
                onRecurrenceChange={setRecurrenceFilter}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                history={isHistory}
              />
            </CollapsibleFilterPanel>

            {viewerAbsentToday ? (
              <Text className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                Estás de ausencia: no verás tareas ni validaciones hasta que vuelvas.
              </Text>
            ) : null}

            {error || actionError ? (
              <Text className="text-sm text-red-600">{error ?? actionError}</Text>
            ) : null}

            {!isHistory && incomingSwaps.length > 0 ? (
              <View className="gap-2">
                <Text className="text-lg font-semibold text-gray-900">Intercambios pendientes</Text>
                <Text className="text-xs text-gray-500">
                  Un compañero quiere que asumas su tarea. Acéptala o recházala.
                </Text>
                {incomingSwaps.map((swap) => {
                  const taskTitle =
                    tasks.find((task) => task.id === swap.task_id)?.title ?? 'una tarea';
                  return (
                  <View key={swap.id} className="rounded-xl border border-blue-200 bg-blue-50 p-3 gap-2">
                    <Text className="text-sm font-semibold text-gray-900">⇄ {taskTitle}</Text>
                    <Text className="text-sm text-gray-700">
                      {swap.from_profile?.display_name ?? 'Un compañero'} te propone el cambio.
                    </Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Aceptar"
                          loading={busyTaskId === swap.id}
                          onPress={() => void runTaskAction(swap.id, () => answerSwap(swap.id, true))}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Rechazar"
                          variant="secondary"
                          loading={busyTaskId === swap.id}
                          onPress={() => void runTaskAction(swap.id, () => answerSwap(swap.id, false))}
                        />
                      </View>
                    </View>
                  </View>
                  );
                })}
              </View>
            ) : null}

            {isHistory && activityEvents.length > 0 ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-500">Movimientos</Text>
                {activityEvents.slice(0, 8).map((event) => (
                  <Text key={event.id} className="text-xs text-gray-600">
                    {formatHistoryDate(event.created_at)} · {event.summary}
                  </Text>
                ))}
              </View>
            ) : null}

          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <MascotLoading />
          ) : (
            <MascotEmpty
              kind={
                isHistory
                  ? activeFilterCount > 0
                    ? 'tasks_filtered'
                    : 'tasks_history'
                  : activeFilterCount > 0
                    ? 'tasks_filtered'
                    : 'tasks_open'
              }
            />
          )
        }
        renderItem={({ item }) => {
          if (isHistory) {
            return (
              <View className="mb-3">
                <TaskCard
                  task={item}
                  showDate
                  currentUserId={user?.id}
                  highlighted={highlightedId === item.id}
                  busy={busyTaskId === item.id}
                  onRepeat={(task) => {
                    setFormTask(task);
                    setFormMode('repeat');
                    setFormVisible(true);
                  }}
                />
              </View>
            );
          }

          const canSubmit =
            (item.status === TASK_STATUS.PENDING || item.status === TASK_STATUS.OVERDUE) &&
            isAssigneeOf(item) &&
            (!item.due_at ||
              !isViewerAbsentOnDate(absences, user?.id, new Date(item.due_at)));
          const canMutate = isAdmin || isAssigneeOf(item) || item.created_by === user?.id;

          return (
            <View className="mb-3">
              <TaskCard
                task={item}
                currentUserId={user?.id}
                highlighted={highlightedId === item.id}
                busy={busyTaskId === item.id}
                canEdit={canMutate}
                onEdit={
                  canMutate
                    ? (task) => {
                        setFormTask(task);
                        setFormMode('edit');
                        setFormVisible(true);
                      }
                    : undefined
                }
                onApprove={
                  item.status === TASK_STATUS.SUBMITTED && !isAssigneeOf(item)
                    ? (task) => setReviewTarget({ task, mode: 'APPROVE' })
                    : undefined
                }
                onDispute={
                  item.status === TASK_STATUS.SUBMITTED && !isAssigneeOf(item)
                    ? (task) => void disputeTaskWithSilenceCheck(task)
                    : undefined
                }
                onRequestSwap={
                  isAssigneeOf(item) && canRequestTaskSwap(item) ? proposeSwap : undefined
                }
                onSubmitProof={
                  canSubmit
                    ? (task) => {
                        setProofTask(task);
                      }
                    : undefined
                }
              />
            </View>
          );
        }}
        contentContainerClassName="pb-8"
      />
      </Animated.View>

      <OverflowMenu
        visible={swapTask !== null}
        title={swapTask ? `¿Quién asume «${swapTask.title}»?` : 'Proponer cambio'}
        onClose={() => setSwapTask(null)}
        actions={members
          .filter((member) => member.user_id !== user?.id)
          .map((member) => ({
            key: member.id,
            label: `Proponer a ${member.profiles?.display_name ?? 'compañero'}`,
            onPress: () => {
              if (!swapTask) {
                return;
              }
              void runTaskAction(swapTask.id, () => requestSwap(swapTask, member.user_id));
            },
          }))}
      />

      <TaskFormModal
        visible={formVisible}
        members={members}
        absences={absences}
        customTypes={taskTypes}
        onCreateType={addTaskType}
        initialTask={formTask}
        mode={formMode}
        onClose={() => {
          setFormVisible(false);
          setFormTask(null);
          setFormMode('create');
        }}
        onDelete={
          formMode === 'edit' && formTask && isAdmin
            ? async () => {
                await confirmDelete(formTask);
                setFormVisible(false);
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (formMode === 'edit' && formTask) {
            await editTask(formTask.id, input);
            return;
          }
          if (formMode === 'repeat' && formTask) {
            await repeatTask(formTask, input);
            return;
          }
          const created = await addTask(input as Omit<UpsertTaskInput, 'home_id'>);
          requestFocus(created.id);
        }}
      />

      <ProofSourceModal
        visible={proofTask !== null}
        proofRequired={activeHome?.proof_mode === 'REQUIRED'}
        cameraOnly={activeHome?.proof_capture === 'CAMERA_ONLY'}
        onClose={() => setProofTask(null)}
        onPick={(source) => {
          const task = proofTask;
          setProofTask(null);
          if (!task) {
            return;
          }
          void runTaskAction(task.id, () => submitProof(task, source));
        }}
      />

      <TaskReviewCommentModal
        visible={reviewTarget !== null}
        mode={reviewTarget?.mode ?? 'APPROVE'}
        busy={Boolean(reviewTarget && busyTaskId === reviewTarget.task.id)}
        onClose={() => setReviewTarget(null)}
        onConfirm={(comment) => {
          if (!reviewTarget) {
            return;
          }
          const { task, mode } = reviewTarget;
          setReviewTarget(null);
          void runTaskAction(task.id, () =>
            reviewTask(task, mode, mode === 'APPROVE' ? '👏' : '🤨', comment || null),
          );
        }}
      />
    </Screen>
  );
}
