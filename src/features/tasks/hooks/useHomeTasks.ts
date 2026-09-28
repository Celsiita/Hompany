import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RecurrenceFilter } from '@/components/ui/RecurrenceFilterChips';
import type { TaskBoardStatusFilter } from '@/components/ui/StatusFilterChips';
import { listHomeActivity, logHomeActivity } from '@/features/home/api/activity-api';
import { listHomeMembers, type HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { pickCompressedProofImage, uploadTaskProof } from '@/features/tasks/api/proof-upload';
import {
  cancelTaskOccurrence,
  createTask,
  createTaskSwapRequest,
  deleteTask,
  ensureRecurringTaskInstances,
  listTaskSwapRequests,
  listTasksByHome,
  reassignTaskOccurrence,
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
  sortHistoryBoardTasks,
  sortOpenBoardTasks,
} from '@/features/tasks/lib/board-filters';
import { canViewerParticipateInTasks, filterTasksForAbsentViewer } from '@/features/tasks/lib/absence-task-rules';
import { useHomeAbsences } from '@/features/home/hooks/useHomeAbsences';
import { partitionTasks, summarizeTasks } from '@/features/tasks/lib/task-summary';
import { tasksBoardSync } from '@/lib/board-sync';
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
  statusFilter: TaskBoardStatusFilter;
  setStatusFilter: (value: TaskBoardStatusFilter) => void;
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
  cancelOccurrence: (taskId: string, scheduledDueAt?: string) => Promise<void>;
  reassignOccurrence: (
    taskId: string,
    assigneeId: string,
    scheduledDueAt?: string,
  ) => Promise<void>;
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
    comment?: string | null,
  ) => Promise<void>;
};

/**
 * Loads and mutates tasks for the active home with board filters.
 */
export function useHomeTasks(): UseHomeTasksResult {
  const { user } = useAuth();
  const { activeHomeId, activeHome } = useHome();
  const { absences } = useHomeAbsences();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [members, setMembers] = useState<HomeMemberWithProfile[]>([]);
  const [activityEvents, setActivityEvents] = useState<HomeActivityEventWithActor[]>([]);
  const [swapRequests, setSwapRequests] = useState<TaskSwapRequestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskBoardCategoryFilter>('ALL');
  const [assigneeScope, setAssigneeScope] = useState<TaskAssigneeScope>('ALL');
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<TaskBoardStatusFilter>('ALL');
  const instanceId = useRef(Symbol('useHomeTasks'));

  const load = useCallback(async () => {
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

  /** Reloads this screen and notifies other tab instances (agenda, etc.). */
  const refresh = useCallback(async () => {
    await load();
    tasksBoardSync.notify(instanceId.current);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return tasksBoardSync.subscribe((sourceId) => {
      if (sourceId === instanceId.current) {
        return;
      }
      void load();
    });
  }, [load]);

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
    async (_task: TaskWithRelations, input: Omit<CreateTaskInput, 'home_id'>) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await createTask({ ...input, home_id: activeHomeId });
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

  const cancelOccurrence = useCallback(
    async (taskId: string, scheduledDueAt?: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await cancelTaskOccurrence({
        homeId: activeHomeId,
        taskId,
        actorId: user.id,
        scheduledDueAt,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
  );

  const reassignOccurrence = useCallback(
    async (taskId: string, assigneeId: string, scheduledDueAt?: string) => {
      if (!activeHomeId || !user) {
        throw new Error('home_id is required');
      }
      await reassignTaskOccurrence({
        homeId: activeHomeId,
        taskId,
        actorId: user.id,
        assigneeId,
        scheduledDueAt,
      });
      await refresh();
    },
    [activeHomeId, refresh, user],
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

      const isAssignee =
        task.assigned_to === user.id ||
        task.task_assignees.some((assignee) => assignee.user_id === user.id);
      if (!isAssignee) {
        throw new Error('Solo puedes completar tus propias tareas');
      }

      if (activeHome?.proof_mode === 'REQUIRED' && !source) {
        throw new Error('Este piso exige una foto de prueba.');
      }
      if (activeHome?.proof_capture === 'CAMERA_ONLY' && source === 'library') {
        throw new Error('Este piso solo admite foto con la cámara.');
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

      // Assignee late completion closes as RESOLVED_LATE; peers never complete overdue tasks.
      if (task.status === TASK_STATUS.OVERDUE) {
        await updateTaskStatus({
          homeId: activeHomeId,
          taskId: task.id,
          fromStatus: task.status,
          toStatus: TASK_STATUS.RESOLVED_LATE,
          completedBy: user.id,
          proofImageUrl: publicUrl,
        });
      } else {
        await updateTaskStatus({
          homeId: activeHomeId,
          taskId: task.id,
          fromStatus: task.status,
          toStatus: TASK_STATUS.SUBMITTED,
          proofImageUrl: publicUrl,
        });
      }
      await refresh();
    },
    [activeHome, activeHomeId, refresh, user],
  );

  const reviewTask = useCallback(
    async (
      task: TaskWithRelations,
      vote: 'APPROVE' | 'DISPUTE',
      emoji: string,
      comment?: string | null,
    ) => {
      if (!activeHomeId || !user) {
        throw new Error('Sesión u hogar no disponibles');
      }
      if (!canViewerParticipateInTasks(absences, user.id)) {
        throw new Error('No puedes validar tareas durante una ausencia.');
      }
      await submitTaskReview({
        homeId: activeHomeId,
        taskId: task.id,
        reviewerId: user.id,
        vote,
        emoji,
        comment,
      });
      await refresh();
    },
    [activeHomeId, absences, refresh, user],
  );

  const viewerTasks = useMemo(
    () => filterTasksForAbsentViewer(tasks, absences, user?.id),
    [tasks, absences, user?.id],
  );
  const canParticipateInTasks = useMemo(
    () => canViewerParticipateInTasks(absences, user?.id),
    [absences, user?.id],
  );

  const { open, closed } = useMemo(() => partitionTasks(viewerTasks), [viewerTasks]);
  const summary = useMemo(() => summarizeTasks(viewerTasks), [viewerTasks]);
  const submittedForReview = useMemo(() => filterReviewBoardTasks(open), [open]);
  const historyTasks = useMemo(() => [...closed], [closed]);

  const boardFilters = {
    category: categoryFilter,
    scope: assigneeScope,
    userId: user?.id,
    recurrence: recurrenceFilter,
    status: statusFilter,
  };

  const filteredOpenTasks = useMemo(
    () =>
      sortOpenBoardTasks(
        applyTaskBoardFilters({ tasks: filterOpenBoardTasks(open), ...boardFilters }),
      ),
    [open, categoryFilter, assigneeScope, recurrenceFilter, statusFilter, user?.id],
  );
  const filteredReviewTasks = useMemo(() => {
    if (!canParticipateInTasks) {
      return [];
    }
    return filteredOpenTasks.filter((task) => task.status === TASK_STATUS.SUBMITTED);
  }, [canParticipateInTasks, filteredOpenTasks]);
  const filteredClosedTasks = useMemo(
    () =>
      sortHistoryBoardTasks(
        applyTaskBoardFilters({ tasks: historyTasks, ...boardFilters }),
      ),
    [historyTasks, categoryFilter, assigneeScope, recurrenceFilter, statusFilter, user?.id],
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
    statusFilter,
    setStatusFilter,
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
    cancelOccurrence,
    reassignOccurrence,
    changeStatus,
    submitProof,
    reviewTask,
  };
}
