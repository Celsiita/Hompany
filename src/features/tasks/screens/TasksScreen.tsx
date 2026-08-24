import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type FlatList as FlatListType,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BoardSectionBar, type BoardSection } from '@/components/ui/BoardSectionBar';
import { Button } from '@/components/ui/Button';
import { OverflowMenu } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ProofSourceModal } from '@/features/tasks/components/ProofSourceModal';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskFilterBar } from '@/features/tasks/components/TaskFilterBar';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { useHomeTasks } from '@/features/tasks/hooks/useHomeTasks';
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
    filteredReviewTasks,
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
    reopenClosedTask,
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
  } = useHomeTasks();

  const [section, setSection] = useState<BoardSection>('ACTIVE');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'repeat'>('create');
  const [formTask, setFormTask] = useState<TaskWithRelations | null>(null);
  const [proofTask, setProofTask] = useState<TaskWithRelations | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
      setFormVisible(false);
      setFormTask(null);
      setFormMode('create');
    },
    [setCategoryFilter, setAssigneeScope, setRecurrenceFilter],
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
    const others = members.filter((member) => member.user_id !== user?.id);
    if (others.length === 0) {
      setActionError('No hay compañeros para intercambiar.');
      return;
    }
    setSwapTask(task);
  }

  const reviewHint =
    assigneeScope === 'MINE'
      ? 'Tus fotos esperando que un compañero las valide.'
      : assigneeScope === 'OTHERS'
        ? 'Valida las fotos de tus compañeros.'
        : 'Fotos pendientes de validación.';

  const incomingSwaps = swapRequests.filter((item) => item.to_user_id === user?.id);

  return (
    <Screen>
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
              subtitle={`${activeHome?.name ?? 'Piso'} · limpieza y orden`}
              onMenuPress={() => setMenuOpen(true)}
            />

            <BoardSectionBar
              section={section}
              onSectionChange={setSection}
              activeLabel="En curso"
            />

            <TaskFilterBar
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              scope={assigneeScope}
              onScopeChange={setAssigneeScope}
              recurrence={recurrenceFilter}
              onRecurrenceChange={setRecurrenceFilter}
            />

            {error || actionError ? (
              <Text className="text-sm text-red-600">{error ?? actionError}</Text>
            ) : null}

            {!isHistory && incomingSwaps.length > 0 ? (
              <View className="gap-2">
                <Text className="text-lg font-semibold text-gray-900">Intercambios</Text>
                {incomingSwaps.map((swap) => (
                  <View key={swap.id} className="rounded-xl border border-blue-200 bg-blue-50 p-3 gap-2">
                    <Text className="text-sm text-gray-800">
                      {swap.from_profile?.display_name ?? 'Un compañero'} te propone un intercambio.
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
                ))}
              </View>
            ) : null}

            {!isHistory && filteredReviewTasks.length > 0 ? (
              <View className="gap-2">
                <Text className="text-lg font-semibold text-gray-900">Feed de revisiones</Text>
                <Text className="text-sm text-gray-600">{reviewHint}</Text>
                {filteredReviewTasks.map((task) => (
                  <TaskCard
                    key={`review-${task.id}`}
                    task={task}
                    highlighted={highlightedId === task.id}
                    busy={busyTaskId === task.id}
                    onApprove={
                      !isAssigneeOf(task)
                        ? (item) =>
                            void runTaskAction(item.id, () => reviewTask(item, 'APPROVE', '👏'))
                        : undefined
                    }
                    onDispute={
                      !isAssigneeOf(task)
                        ? (item) =>
                            void runTaskAction(item.id, () => reviewTask(item, 'DISPUTE', '🤨'))
                        : undefined
                    }
                  />
                ))}
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
            <ActivityIndicator color="#2563eb" />
          ) : !isHistory && filteredReviewTasks.length > 0 ? null : (
            <Text className="text-center text-gray-500 py-8">
              {isHistory
                ? 'Aún no hay tareas en el historial.'
                : 'No hay tareas con estos filtros.'}
            </Text>
          )
        }
        renderItem={({ item }) => {
          if (isHistory) {
            return (
              <View className="mb-3">
                <TaskCard
                  task={item}
                  showDate
                  highlighted={highlightedId === item.id}
                  busy={busyTaskId === item.id}
                  onRepeat={(task) => {
                    setFormTask(task);
                    setFormMode('repeat');
                    setFormVisible(true);
                  }}
                  onReopen={(task) => void runTaskAction(task.id, () => reopenClosedTask(task))}
                />
              </View>
            );
          }

          const canSubmit =
            item.status === TASK_STATUS.PENDING &&
            (assigneeScope === 'MINE'
              ? isAssigneeOf(item) || item.task_assignees.length === 0
              : true);
          const canMutate = isAdmin || isAssigneeOf(item) || item.created_by === user?.id;

          return (
            <View className="mb-3">
              <TaskCard
                task={item}
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
                onRequestSwap={isAssigneeOf(item) ? proposeSwap : undefined}
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

      <OverflowMenu
        visible={menuOpen}
        title="Tareas"
        onClose={() => setMenuOpen(false)}
        actions={[
          {
            key: 'create',
            label: 'Nueva tarea',
            onPress: () => {
              setFormTask(null);
              setFormMode('create');
              setFormVisible(true);
            },
          },
          {
            key: 'paused',
            label: 'Ver pausadas y archivadas',
            onPress: () => setSection('HISTORY'),
          },
        ]}
      />

      <OverflowMenu
        visible={swapTask !== null}
        title={swapTask ? `Intercambiar «${swapTask.title}»` : 'Intercambiar'}
        onClose={() => setSwapTask(null)}
        actions={members
          .filter((member) => member.user_id !== user?.id)
          .map((member) => ({
            key: member.id,
            label: member.profiles?.display_name ?? 'Compañero',
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
    </Screen>
  );
}
