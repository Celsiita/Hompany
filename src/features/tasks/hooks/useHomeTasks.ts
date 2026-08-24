import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import { listHomeActivity, logHomeActivity } from '@/features/home/api/activity-api';
import { listHomeMembers, type HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { pickCompressedProofImage, uploadTaskProof } from '@/features/tasks/api/proof-upload';
import {
  createTask,
  createTaskSwapRequest,
  deleteTask,
  ensureRecurringTaskInstances,
  listTaskSwapRequests,
  listTasksByHome,
  reopenTask,
  respondToTaskSwap,
  submitTaskReview,
  updateTask,
  updateTaskStatus,
} from '@/features/tasks/api/tasks-api';
import {
  applyTaskBoardFilters,
  filterOpenBoardTasks,
  filterReviewBoardTasks,
} from '@/features/tasks/lib/board-filters';
import { isPausedRecurring } from '@/features/tasks/lib/recurrence';
import { partitionTasks, summarizeTasks } from '@/features/tasks/lib/task-summary';
import { parseRecurrenceConfig } from '@/lib/recurrence';
import { isHomeAdminRole } from '@/lib/roles';
import { useAuth } from '@/providers/AuthProvider';
import { useHome } from '@/providers/HomeProvider';
import type {
  CreateTaskInput,
  TaskAssigneeScope,
  TaskBoardCategoryFilter,
  UpsertTaskInput,
} from '@/schemas/task.schema';
import type {
  HomeActivityEventWithActor,
  TaskSwapRequestWithProfiles,
  TaskWithRelations,
} from '@/types/database.types';
import { TASK_STATUS, type TaskStatus } from '@/types/task-status';

type UseHomeTasksResult = {
  tasks: TaskWithRelations[];
  openTasks: TaskWithRelations[];
  closedTasks: TaskWithRelations[];
  submittedForReview: TaskWithRelations[];
  filteredOpenTasks: TaskWithRelations[];
  filteredReviewTasks: TaskWithRelations[];
  filteredClosedTasks: TaskWithRelations[];
  activityEvents: HomeActivityEventWithActor[];
  swapRequests: TaskSwapRequestWithProfiles[];
  members: HomeMemberWithProfile[];
  isAdmin: boolean;
  summary: ReturnType<typeof summarizeTasks>;
  categoryFilter: TaskBoardCategoryFilter;
  setCategoryFilter: (value: TaskBoardCategoryFilter) => void;
  assigneeScope: TaskAssigneeScope;
  setAssigneeScope: (value: TaskAssigneeScope) => void;
  recurrenceFilter: RecurrenceFilter;
  setRecurrenceFilter: (value: RecurrenceFilter) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (input: Omit<CreateTaskInput, 'home_id'>) => Promise<TaskWithRelations>;
  editTask: (taskId: string, input: Omit<UpsertTaskInput, 'home_id'>) => Promise<TaskWithRelations>;
  removeTask: (taskId: string) => Promise<void>;
  reopenClosedTask: (task: TaskWithRelations) => Promise<void>;
  repeatTask: (task: TaskWithRelations, input: Omit<CreateTaskInput, 'home_id'>) => Promise<void>;
  requestSwap: (task: TaskWithRelations, toUserId: string) => Promise<void>;
  answerSwap: (requestId: string, accept: boolean) => Promise<void>;
  changeStatus: (
    task: TaskWithRelations,
    toStatus: TaskStatus,
    completedBy?: string | null,
  ) => Promise<void>;
  submitProof: (
    task: TaskWithRelations,
    source: 'camera' | 'library' | null,
  ) => Promise<void>;
  reviewTask: (
    task: TaskWithRelations,
    vote: 'APPROVE' | 'DISPUTE',
    emoji: string,
  ) => Promise<void>;
};

/**
 * Loads and mutates tasks for the active home with board filters.
 */
export function useHomeTasks(): UseHomeTasksResult {
  const { user } = useAuth();
  const { activeHomeId } = useHome();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [members, setMembers] = useState<HomeMemberWithProfile[]>([]);
  const [activityEvents, setActivityEvents] = useState<HomeActivityEventWithActor[]>([]);
  const [swapRequests, setSwapRequests] = useState<TaskSwapRequestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskBoardCategoryFilter>('ALL');
  const [assigneeScope, setAssigneeScope] = useState<TaskAssigneeScope>('ALL');
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>('ALL');

  const refresh = useCallback(async () => {
    if (!activeHomeId) {
      setTasks([]);
      setMembers([]);
      setActivityEvents([]);
      setSwapRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await ensureRecurringTaskInstances(activeHomeId);
      const [nextTasks, nextMembers, nextActivity, nextSwaps] = await Promise.all([
        listTasksByHome(activeHomeId),
        listHomeMembers(activeHomeId),
        listHomeActivity(activeHomeId),
        listTaskSwapRequests(activeHomeId),
      ]);
      setTasks(nextTasks);
      setMembers(nextMembers);
      setActivityEvents(nextActivity.filter((event) => event.entity_type === 'task' || event.action.startsWith('ADMIN_')));
      setSwapRequests(nextSwaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  }, [activeHomeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isAdmin = useMemo(() => {
    const mine = members.find((member) => member.user_id === user?.id);
    return isHomeAdminRole(mine?.role);
  }, [members, user?.id]);

  const addTask = useCallback(
    async (input: Omit<CreateTaskInput, 'home_id'>) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      const created = await createTask({ ...input, home_id: activeHomeId });
      await refresh();
      return created;
    },
    [activeHomeId, refresh],
  );

  const editTask = useCallback(
    async (taskId: string, input: Omit<UpsertTaskInput, 'home_id'>) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      const current = tasks.find((task) => task.id === taskId);
      const ownsTask = Boolean(
        current &&
          (current.created_by === user.id ||
            current.assigned_to === user.id ||
            current.task_assignees.some((assignee) => assignee.user_id === user.id)),
      );
      const updated = await updateTask(taskId, { ...input, home_id: activeHomeId });
      if (isAdmin && !ownsTask) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_EDIT_TASK',
          entityType: 'task',
          entityId: taskId,
          summary: `Editó la tarea «${input.title}»`,
        });
      }
      if (isAdmin && input.recurrence_config?.is_paused && !parseRecurrenceConfig(current?.recurrence_config).is_paused) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_PAUSE_RECURRENCE',
          entityType: 'recurrence',
          entityId: taskId,
          summary: `Pausó la recurrencia de «${input.title}»`,
        });
      }
      await refresh();
      return updated;
    },
    [activeHomeId, isAdmin, refresh, tasks, user],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      const current = tasks.find((task) => task.id === taskId);
      await deleteTask(activeHomeId, taskId);
      if (isAdmin && current) {
        await logHomeActivity({
          homeId: activeHomeId,
          actorId: user.id,
          action: 'ADMIN_DELETE_TASK',
          entityType: 'task',
          entityId: taskId,
          summary: `Eliminó la tarea «${current.title}»`,
        });
      }
      await refresh();
    },
    [activeHomeId, isAdmin, refresh, tasks, user],
  );

  const reopenClosedTask = useCallback(
    async (task: TaskWithRelations) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await reopenTask({ homeId: activeHomeId, taskId: task.id, actorId: user.id });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const repeatTask = useCallback(
    async (task: TaskWithRelations, input: Omit<CreateTaskInput, 'home_id'>) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await createTask({ ...input, home_id: activeHomeId });
      await logHomeActivity({
        homeId: activeHomeId,
        actorId: user.id,
        action: 'TASK_REPEAT',
        entityType: 'task',
        entityId: task.id,
        summary: `Repitió «${task.title}» como nueva instancia`,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const requestSwap = useCallback(
    async (task: TaskWithRelations, toUserId: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await createTaskSwapRequest({
        homeId: activeHomeId,
        taskId: task.id,
        fromUserId: user.id,
        toUserId,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const answerSwap = useCallback(
    async (requestId: string, accept: boolean) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await respondToTaskSwap({ homeId: activeHomeId, requestId, accept });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const changeStatus = useCallback(
    async (task: TaskWithRelations, toStatus: TaskStatus, completedBy?: string | null) => {
      if (!activeHomeId) {
        throw new Error('home_id is required');
      }
      await updateTaskStatus({
        homeId: activeHomeId,
        taskId: task.id,
        fromStatus: task.status,
        toStatus,
        completedBy,
      });
      await refresh();
    },
    [activeHomeId, refresh],
  );

  const submitProof = useCallback(
    async (task: TaskWithRelations, source: 'camera' | 'library' | null) => {
      if (!activeHomeId || !user) {
        throw new Error('Sesión u hogar no disponibles');
      }

      let publicUrl: string | null = null;
      if (source) {
        const picked = await pickCompressedProofImage(source);
        if (!picked) {
          return;
        }
        publicUrl = await uploadTaskProof({
          homeId: activeHomeId,
          taskId: task.id,
          userId: user.id,
          localUri: picked.uri,
          mimeType: picked.mimeType,
        });
      }

      await updateTaskStatus({
        homeId: activeHomeId,
        taskId: task.id,
        fromStatus: task.status,
        toStatus: TASK_STATUS.SUBMITTED,
        proofImageUrl: publicUrl,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const reviewTask = useCallback(
    async (task: TaskWithRelations, vote: 'APPROVE' | 'DISPUTE', emoji: string) => {
      if (!activeHomeId || !user) {
        throw new Error('Sesión u hogar no disponibles');
      }
      await submitTaskReview({
        homeId: activeHomeId,
        taskId: task.id,
        reviewerId: user.id,
        vote,
        emoji,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const { open, closed } = useMemo(() => partitionTasks(tasks), [tasks]);
  const summary = useMemo(() => summarizeTasks(tasks), [tasks]);
  const submittedForReview = useMemo(() => filterReviewBoardTasks(open), [open]);
  const historyTasks = useMemo(() => {
    const pausedOpen = open.filter((task) => isPausedRecurring(task));
    return [...closed, ...pausedOpen].sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    );
  }, [closed, open]);

  const boardFilters = {
    category: categoryFilter,
    scope: assigneeScope,
    userId: user?.id,
    recurrence: recurrenceFilter,
  };

  const filteredOpenTasks = useMemo(
    () => applyTaskBoardFilters({ tasks: filterOpenBoardTasks(open), ...boardFilters }),
    [open, categoryFilter, assigneeScope, recurrenceFilter, user?.id],
  );
  const filteredReviewTasks = useMemo(
    () => applyTaskBoardFilters({ tasks: submittedForReview, ...boardFilters }),
    [submittedForReview, categoryFilter, assigneeScope, recurrenceFilter, user?.id],
  );
  const filteredClosedTasks = useMemo(
    () => applyTaskBoardFilters({ tasks: historyTasks, ...boardFilters }),
    [historyTasks, categoryFilter, assigneeScope, recurrenceFilter, user?.id],
  );

  return {
    tasks,
    openTasks: open,
    closedTasks: closed,
    submittedForReview,
    filteredOpenTasks,
    filteredReviewTasks,
    filteredClosedTasks,
    activityEvents,
    swapRequests,
    members,
    isAdmin,
    summary,
    categoryFilter,
    setCategoryFilter,
    assigneeScope,
    setAssigneeScope,
    recurrenceFilter,
    setRecurrenceFilter,
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
    changeStatus,
    submitProof,
    reviewTask,
  };
}
