import {
  createTaskInputSchema,
  type CreateTaskInput,
  upsertTaskInputSchema,
  upsertTaskTemplateInputSchema,
  type UpsertTaskInput,
  type UpsertTaskTemplateInput,
} from '@/schemas/task.schema';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  Task,
  TaskReview,
  TaskSwapRequestWithProfiles,
  TaskTemplate,
  TaskTemplateWithRelations,
  TaskWithRelations,
} from '@/types/database.types';
import type { TaskStatus } from '@/types/task-status';
import { taskStatusSchema } from '@/schemas/task-status.schema';
import { assertTaskTransition } from '@/features/tasks/lib/task-transitions';
import {
  computeNextDueAt,
  computeSpawnDueAt,
  countOpenInstancesForTemplate,
  OPEN_INSTANCE_STATUSES,
  parseRecurrenceConfig,
  shouldSpawnRecurringInstance,
  SPAWN_ON_CLOSE_STATUSES,
} from '@/features/tasks/lib/recurrence';
import { logHomeActivity } from '@/features/home/api/activity-api';
import { listHomeMembers } from '@/features/home/api/homes-api';
import {
  assigneeOverrideForDate,
  cycleInstanceTitle,
  isSkippedOccurrenceDate,
  stripCycleSuffix,
  withAssigneeOverride,
  withSkippedOccurrenceDate,
  type RecurrenceConfig,
} from '@/lib/recurrence';
import {
  absentMemberWarning,
  areAllMembersAbsent,
  filterAvailableMemberIds,
  isUserAbsentOnDate,
  pickNextAvailableAssignee,
} from '@/lib/absences';
import { listAbsencesByHome } from '@/features/home/api/absences-api';
import {
  listRotatingTasksInDateRange,
  pickReplacementForAbsentAssignee,
} from '@/features/tasks/lib/punctual-absence-reassign';
import type { MemberAbsence } from '@/schemas/absence.schema';

const TASK_SELECT = `
  *,
  task_assignees (
    id,
    home_id,
    task_id,
    user_id,
    created_at,
    profiles (
      id,
      display_name,
      avatar_url
    )
  )
`;

const TEMPLATE_SELECT = `
  *,
  task_template_assignees (
    id,
    home_id,
    template_id,
    user_id,
    created_at,
    profiles (
      id,
      display_name,
      avatar_url
    )
  )
`;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

function isRecurring(recurrence: Task['recurrence']): boolean {
  return recurrence !== 'ONCE';
}

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function listMemberIds(homeId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_members')
    .select('user_id')
    .eq('home_id', homeId)
    .order('joined_at', { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => row.user_id);
}

async function resolveAssigneeIds(params: {
  homeId: string;
  assigneeIds: string[];
  autoAssign: boolean;
  lastAssigneeId?: string | null;
  dueAt: Date;
  absences: readonly MemberAbsence[];
}): Promise<string[]> {
  if (!params.autoAssign) {
    return filterAvailableMemberIds(params.assigneeIds, params.absences, params.dueAt);
  }
  const pool =
    params.assigneeIds.length > 0 ? params.assigneeIds : await listMemberIds(params.homeId);
  const next = pickNextAvailableAssignee(
    pool,
    params.lastAssigneeId ?? null,
    params.absences,
    params.dueAt,
  );
  return next ? [next] : [];
}

/**
 * Throws when any assignee is absent on the due date (manual assignment guard).
 */
export function assertAssigneesAvailableForDate(params: {
  assigneeIds: string[];
  absences: readonly MemberAbsence[];
  dueAt: Date;
  memberNames: Map<string, string>;
}): void {
  for (const userId of params.assigneeIds) {
    if (isUserAbsentOnDate(params.absences, userId, params.dueAt)) {
      const name = params.memberNames.get(userId) ?? 'Compañero';
      throw new Error(absentMemberWarning(name));
    }
  }
}

async function persistTemplateRecurrenceConfig(
  homeId: string,
  templateId: string,
  config: RecurrenceConfig,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('task_templates')
    .update({ recurrence_config: config })
    .eq('id', templateId)
    .eq('home_id', homeId);
  if (error) {
    throw error;
  }
}

/**
 * Lists tasks for a home with assignees. Always filters by home_id.
 */
export async function listTasksByHome(homeId: string): Promise<TaskWithRelations[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('home_id', scopedHomeId)
    .order('due_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TaskWithRelations[];
}

/**
 * Lists reusable task templates for a home. Always filters by home_id.
 */
export async function listTaskTemplatesByHome(
  homeId: string,
): Promise<TaskTemplateWithRelations[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('task_templates')
    .select(TEMPLATE_SELECT)
    .eq('home_id', scopedHomeId)
    .order('title', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TaskTemplateWithRelations[];
}

async function getTemplateById(
  homeId: string,
  templateId: string,
): Promise<TaskTemplateWithRelations> {
  const templates = await listTaskTemplatesByHome(homeId);
  const template = templates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error('Plantilla no encontrada');
  }
  return template;
}

async function syncAssignees(params: {
  homeId: string;
  taskId: string;
  assigneeIds: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', params.taskId)
    .eq('home_id', params.homeId);

  if (deleteError) {
    throw deleteError;
  }

  if (params.assigneeIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('task_assignees').insert(
    params.assigneeIds.map((userId) => ({
      home_id: params.homeId,
      task_id: params.taskId,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function syncTemplateAssignees(params: {
  homeId: string;
  templateId: string;
  assigneeIds: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('task_template_assignees')
    .delete()
    .eq('template_id', params.templateId)
    .eq('home_id', params.homeId);

  if (deleteError) {
    throw deleteError;
  }

  if (params.assigneeIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('task_template_assignees').insert(
    params.assigneeIds.map((userId) => ({
      home_id: params.homeId,
      template_id: params.templateId,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function insertTaskInstance(params: {
  homeId: string;
  template: Pick<
    TaskTemplate,
    'id' | 'title' | 'description' | 'category' | 'item_type_id' | 'icon' | 'recurrence' | 'points_value'
  > & {
    base_title?: string | null;
    auto_assign?: boolean;
    recurrence_config?: RecurrenceConfig | unknown;
    created_by?: string | null;
    due_mode?: import('@/lib/recurrence').DueMode | null;
  };
  assigneeIds: string[];
  dueAt: string;
  startsAt?: string | null;
  allDay?: boolean;
  lastAssigneeId?: string | null;
}): Promise<TaskWithRelations | null> {
  const absences = await listAbsencesByHome(params.homeId);
  let config = parseRecurrenceConfig(params.template.recurrence_config);
  let dueAt = params.dueAt;
  const dueMode = params.template.due_mode ?? 'DEADLINE';
  const pool =
    params.assigneeIds.length > 0
      ? params.assigneeIds
      : await listMemberIds(params.homeId);

  for (let attempt = 0; attempt < 52; attempt += 1) {
    const dueDate = new Date(dueAt);

    if (isSkippedOccurrenceDate(config, dueDate)) {
      dueAt = computeNextDueAt(
        dueAt,
        params.template.recurrence,
        new Date(),
        config,
        dueMode,
      );
      continue;
    }

    const overrideUserId = assigneeOverrideForDate(config, dueDate);

    if (!overrideUserId && areAllMembersAbsent(pool, absences, dueDate)) {
      config = withSkippedOccurrenceDate(config, dueDate);
      await persistTemplateRecurrenceConfig(params.homeId, params.template.id, config);
      dueAt = computeNextDueAt(dueAt, params.template.recurrence, new Date(), config, dueMode);
      continue;
    }

    const resolvedAssignees = overrideUserId
      ? [overrideUserId]
      : await resolveAssigneeIds({
          homeId: params.homeId,
          assigneeIds: params.assigneeIds,
          autoAssign: Boolean(params.template.auto_assign),
          lastAssigneeId: params.lastAssigneeId,
          dueAt: dueDate,
          absences,
        });

    if (resolvedAssignees.length === 0) {
      config = withSkippedOccurrenceDate(config, dueDate);
      await persistTemplateRecurrenceConfig(params.homeId, params.template.id, config);
      dueAt = computeNextDueAt(dueAt, params.template.recurrence, new Date(), config, dueMode);
      continue;
    }

    const baseTitle = stripCycleSuffix(params.template.base_title ?? params.template.title);
    const title = cycleInstanceTitle(baseTitle, params.template.recurrence, dueDate);
    const assigneeIds = resolvedAssignees;
    const createdBy = params.template.created_by ?? (await currentUserId());

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        home_id: params.homeId,
        title,
        base_title: baseTitle,
        description: params.template.description,
        category: params.template.category,
        item_type_id: params.template.item_type_id ?? null,
        icon: params.template.icon,
        recurrence: params.template.recurrence,
        recurrence_config: config,
        auto_assign: Boolean(params.template.auto_assign),
        due_at: dueAt,
        due_mode: dueMode,
        starts_at: params.startsAt ?? dueAt,
        all_day: Boolean(params.allDay),
        points_value: params.template.points_value,
        assigned_to: assigneeIds[0] ?? null,
        created_by: createdBy,
        status: 'PENDING',
        is_template: false,
        template_id: params.template.id,
      })
      .select('id')
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return null;
      }
      throw error;
    }

    await syncAssignees({
      homeId: params.homeId,
      taskId: data.id,
      assigneeIds,
    });

    const tasks = await listTasksByHome(params.homeId);
    const created = tasks.find((task) => task.id === data.id);
    if (!created) {
      throw new Error('Task created but not found');
    }
    return created;
  }

  throw new Error(
    'No se pudo programar la tarea: todas las fechas del periodo tienen ausencias totales.',
  );
}

async function maybeSpawnNextInstance(homeId: string, closedTask: Task): Promise<void> {
  if (!closedTask.template_id || !SPAWN_ON_CLOSE_STATUSES.includes(closedTask.status)) {
    return;
  }

  const [template, tasks] = await Promise.all([
    getTemplateById(homeId, closedTask.template_id),
    listTasksByHome(homeId),
  ]);

  if (
    !shouldSpawnRecurringInstance({
      recurrence: template.recurrence,
      is_active: template.is_active,
      openInstanceCount: countOpenInstancesForTemplate(tasks, template.id),
      recurrence_config: parseRecurrenceConfig(template.recurrence_config),
    })
  ) {
    return;
  }

  if (!isRecurring(template.recurrence)) {
    return;
  }

  await insertTaskInstance({
    homeId,
    template,
    assigneeIds: template.task_template_assignees.map((assignee) => assignee.user_id),
    dueAt: computeNextDueAt(
      closedTask.due_at,
      template.recurrence,
      new Date(),
      parseRecurrenceConfig(template.recurrence_config),
      closedTask.due_mode ?? template.due_mode ?? 'DEADLINE',
    ),
    lastAssigneeId: closedTask.assigned_to,
  });
}

/**
 * Creates a reusable template plus the first board instance.
 */
export async function createTask(input: CreateTaskInput): Promise<TaskWithRelations> {
  const parsed = createTaskInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const recurring = isRecurring(parsed.recurrence);
  const config = parsed.recurrence_config ?? {};
  const paused = Boolean(config.is_paused);
  const actorId = await currentUserId();
  const baseTitle = stripCycleSuffix(parsed.title);

  const { data: template, error: templateError } = await supabase
    .from('task_templates')
    .insert({
      home_id: scopedHomeId,
      title: baseTitle,
      base_title: baseTitle,
      description: parsed.description ?? null,
      category: parsed.category,
      item_type_id: parsed.item_type_id ?? null,
      icon: parsed.icon,
      recurrence: parsed.recurrence,
      recurrence_config: config,
      auto_assign: parsed.auto_assign,
      points_value: parsed.points_value,
      due_mode: parsed.due_mode,
      starts_at: parsed.starts_at ?? null,
      all_day: parsed.all_day ?? false,
      is_active: recurring && !paused,
    })
    .select('id')
    .single();

  if (templateError) {
    throw templateError;
  }

  await syncTemplateAssignees({
    homeId: scopedHomeId,
    templateId: template.id,
    assigneeIds: parsed.assignee_ids,
  });

  if (!parsed.auto_assign && parsed.assignee_ids.length > 0) {
    const [absences, members] = await Promise.all([
      listAbsencesByHome(scopedHomeId),
      listHomeMembers(scopedHomeId),
    ]);
    const memberNames = new Map(
      members.map((member) => [
        member.user_id,
        member.profiles?.display_name ?? 'Compañero',
      ]),
    );
    assertAssigneesAvailableForDate({
      assigneeIds: parsed.assignee_ids,
      absences,
      dueAt: new Date(parsed.due_at),
      memberNames,
    });
  }

  const created = await insertTaskInstance({
    homeId: scopedHomeId,
    template: {
      id: template.id,
      title: baseTitle,
      base_title: baseTitle,
      description: parsed.description ?? null,
      category: parsed.category,
      item_type_id: parsed.item_type_id ?? null,
      icon: parsed.icon,
      recurrence: parsed.recurrence,
      points_value: parsed.points_value,
      auto_assign: parsed.auto_assign,
      recurrence_config: config,
      created_by: actorId,
      due_mode: parsed.due_mode,
    },
    assigneeIds: parsed.assignee_ids,
    dueAt: parsed.due_at,
    startsAt: parsed.starts_at ?? parsed.due_at,
    allDay: parsed.all_day,
  });

  if (!created) {
    throw new Error('Task created but not found');
  }
  return created;
}

/**
 * Updates a task instance and its linked template.
 */
export async function updateTask(
  taskId: string,
  input: UpsertTaskInput,
): Promise<TaskWithRelations> {
  const parsed = upsertTaskInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();

  const { data: current, error: currentError } = await supabase
    .from('tasks')
    .select('template_id')
    .eq('id', taskId)
    .eq('home_id', scopedHomeId)
    .single();

  if (currentError) {
    throw currentError;
  }

  if (!parsed.auto_assign && parsed.assignee_ids.length > 0) {
    const [absences, members] = await Promise.all([
      listAbsencesByHome(scopedHomeId),
      listHomeMembers(scopedHomeId),
    ]);
    const memberNames = new Map(
      members.map((member) => [
        member.user_id,
        member.profiles?.display_name ?? 'Compañero',
      ]),
    );
    assertAssigneesAvailableForDate({
      assigneeIds: parsed.assignee_ids,
      absences,
      dueAt: new Date(parsed.due_at),
      memberNames,
    });
  }

  const config = parsed.recurrence_config ?? {};
  const baseTitle = stripCycleSuffix(parsed.title);
  const title = cycleInstanceTitle(baseTitle, parsed.recurrence, new Date(parsed.due_at));

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      base_title: baseTitle,
      description: parsed.description ?? null,
      category: parsed.category,
      item_type_id: parsed.item_type_id ?? null,
      icon: parsed.icon,
      recurrence: parsed.recurrence,
      recurrence_config: config,
      auto_assign: parsed.auto_assign,
      due_at: parsed.due_at,
      due_mode: parsed.due_mode,
      starts_at: parsed.starts_at ?? parsed.due_at,
      all_day: parsed.all_day ?? false,
      points_value: parsed.points_value,
      assigned_to: parsed.assignee_ids[0] ?? null,
    })
    .eq('id', taskId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncAssignees({
    homeId: scopedHomeId,
    taskId,
    assigneeIds: parsed.assignee_ids,
  });

  if (current.template_id) {
    const { error: templateError } = await supabase
      .from('task_templates')
      .update({
        title: baseTitle,
        base_title: baseTitle,
        description: parsed.description ?? null,
        category: parsed.category,
        item_type_id: parsed.item_type_id ?? null,
        icon: parsed.icon,
        recurrence: parsed.recurrence,
        recurrence_config: config,
        auto_assign: parsed.auto_assign,
        points_value: parsed.points_value,
        due_mode: parsed.due_mode,
        starts_at: parsed.starts_at ?? null,
        all_day: parsed.all_day ?? false,
        is_active: isRecurring(parsed.recurrence) && !config.is_paused,
      })
      .eq('id', current.template_id)
      .eq('home_id', scopedHomeId);

    if (templateError) {
      throw templateError;
    }

    await syncTemplateAssignees({
      homeId: scopedHomeId,
      templateId: current.template_id,
      assigneeIds: parsed.assignee_ids,
    });
  }

  const tasks = await listTasksByHome(scopedHomeId);
  const updated = tasks.find((task) => task.id === taskId);
  if (!updated) {
    throw new Error('Task updated but not found');
  }
  return updated;
}

/**
 * Updates a saved template without touching closed history rows.
 */
export async function updateTaskTemplate(
  templateId: string,
  input: UpsertTaskTemplateInput,
): Promise<TaskTemplateWithRelations> {
  const parsed = upsertTaskTemplateInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const current = await getTemplateById(scopedHomeId, templateId);

  const { error } = await supabase
    .from('task_templates')
    .update({
      title: parsed.title,
      description: parsed.description ?? null,
      category: parsed.category,
      item_type_id: parsed.item_type_id ?? null,
      icon: parsed.icon,
      recurrence: parsed.recurrence,
      points_value: parsed.points_value,
      is_active: isRecurring(parsed.recurrence) ? current.is_active : false,
    })
    .eq('id', templateId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncTemplateAssignees({
    homeId: scopedHomeId,
    templateId,
    assigneeIds: parsed.assignee_ids,
  });

  return getTemplateById(scopedHomeId, templateId);
}

/**
 * Deletes a task instance scoped by home_id. Recurring templates stay in the database.
 */
export async function deleteTask(homeId: string, taskId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Pauses a recurring template (`is_active = false`) and skips its open instance.
 */
export async function deactivateTaskTemplate(homeId: string, templateId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('task_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  const tasks = await listTasksByHome(scopedHomeId);
  const openTasks = tasks.filter(
    (task) => task.template_id === templateId && OPEN_INSTANCE_STATUSES.includes(task.status),
  );

  for (const task of openTasks) {
    await updateTaskStatus({
      homeId: scopedHomeId,
      taskId: task.id,
      fromStatus: task.status,
      toStatus: 'SKIPPED',
    });
  }
}

/**
 * Deletes a saved template. Open instances of it are skipped first.
 */
export async function deleteTaskTemplate(homeId: string, templateId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  await deactivateTaskTemplate(scopedHomeId, templateId);

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', templateId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Creates a board instance from a saved template. Reactivates DAILY/WEEKLY.
 */
export async function spawnTaskFromTemplate(
  homeId: string,
  templateId: string,
): Promise<TaskWithRelations> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const [template, tasks] = await Promise.all([
    getTemplateById(scopedHomeId, templateId),
    listTasksByHome(scopedHomeId),
  ]);

  const openCount = countOpenInstancesForTemplate(tasks, template.id);
  if (openCount > 0) {
    throw new Error('Esta tarea ya está en el tablero.');
  }

  if (isRecurring(template.recurrence) && !template.is_active) {
    const { error } = await supabase
      .from('task_templates')
      .update({ is_active: true })
      .eq('id', template.id)
      .eq('home_id', scopedHomeId);

    if (error) {
      throw error;
    }
  }

  const lastInstance = [...tasks]
    .filter((task) => task.template_id === template.id)
    .sort((a, b) => Date.parse(b.due_at) - Date.parse(a.due_at))[0];

  const dueAt =
    lastInstance && isRecurring(template.recurrence)
      ? computeNextDueAt(lastInstance.due_at, template.recurrence)
      : computeSpawnDueAt(template.recurrence);

  const created = await insertTaskInstance({
    homeId: scopedHomeId,
    template,
    assigneeIds: template.task_template_assignees.map((assignee) => assignee.user_id),
    dueAt,
  });

  if (!created) {
    throw new Error('Esta tarea ya está en el tablero.');
  }
  return created;
}

/**
 * Spawns missing DAILY/WEEKLY instances for active templates.
 */
export async function ensureRecurringTaskInstances(homeId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const [templates, tasks] = await Promise.all([
    listTaskTemplatesByHome(scopedHomeId),
    listTasksByHome(scopedHomeId),
  ]);

  for (const template of templates) {
    if (
      !shouldSpawnRecurringInstance({
        recurrence: template.recurrence,
        is_active: template.is_active,
        openInstanceCount: countOpenInstancesForTemplate(tasks, template.id),
        recurrence_config: parseRecurrenceConfig(template.recurrence_config),
      }) ||
      !isRecurring(template.recurrence)
    ) {
      continue;
    }

    const lastInstance = [...tasks]
      .filter((task) => task.template_id === template.id)
      .sort((a, b) => Date.parse(b.due_at) - Date.parse(a.due_at))[0];

    const config = parseRecurrenceConfig(template.recurrence_config);
    const dueAt = lastInstance
      ? computeNextDueAt(lastInstance.due_at, template.recurrence, new Date(), config)
      : computeSpawnDueAt(template.recurrence, new Date(), config);

    await insertTaskInstance({
      homeId: scopedHomeId,
      template,
      assigneeIds: template.task_template_assignees.map((assignee) => assignee.user_id),
      dueAt,
      lastAssigneeId: lastInstance?.assigned_to,
    });
  }
}

/**
 * Updates a task status within a home and spawns the next recurring copy when needed.
 */
export async function updateTaskStatus(params: {
  homeId: string;
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  completedBy?: string | null;
  proofImageUrl?: string | null;
}): Promise<Task> {
  const scopedHomeId = requireHomeId(params.homeId);
  const toStatus = taskStatusSchema.parse(params.toStatus);
  assertTaskTransition(params.fromStatus, toStatus);

  const supabase = getSupabaseClient();
  const patch: Partial<Task> = {
    status: toStatus,
  };

  if (params.proofImageUrl !== undefined) {
    patch.proof_image_url = params.proofImageUrl;
  }

  if (toStatus === 'COMPLETED' || toStatus === 'RESOLVED_LATE' || toStatus === 'RESOLVED_BY_PEER') {
    patch.completed_by = params.completedBy ?? null;
    patch.completed_at = new Date().toISOString();
  }

  if (toStatus === 'PENDING' || toStatus === 'SUBMITTED' || toStatus === 'OVERDUE') {
    patch.completed_at = null;
    if (toStatus === 'PENDING') {
      patch.completed_by = null;
    }
  }

  if (toStatus === 'SUBMITTED') {
    patch.review_note = null;
    patch.review_note_kind = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', params.taskId)
    .eq('home_id', scopedHomeId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await maybeSpawnNextInstance(scopedHomeId, data);
  return data;
}

/**
 * Submits a review vote for a submitted task.
 */
export async function submitTaskReview(params: {
  homeId: string;
  taskId: string;
  reviewerId: string;
  vote: 'APPROVE' | 'DISPUTE';
  emoji: string;
  comment?: string | null;
}): Promise<TaskReview> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const comment = params.comment?.trim() || null;

  if (params.vote === 'DISPUTE' && !comment) {
    throw new Error('Indica el motivo de la impugnación.');
  }

  const absences = await listAbsencesByHome(scopedHomeId);
  if (isUserAbsentOnDate(absences, params.reviewerId, new Date())) {
    throw new Error('No puedes validar tareas durante una ausencia.');
  }

  const { data, error } = await supabase
    .from('task_reviews')
    .upsert(
      {
        home_id: scopedHomeId,
        task_id: params.taskId,
        reviewer_id: params.reviewerId,
        vote: params.vote,
        emoji: params.emoji,
        comment,
      },
      { onConflict: 'task_id,reviewer_id' },
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (params.vote === 'APPROVE') {
    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', params.taskId)
      .eq('home_id', scopedHomeId)
      .single();

    if (taskError) {
      throw taskError;
    }

    await updateTaskStatus({
      homeId: scopedHomeId,
      taskId: params.taskId,
      fromStatus: 'SUBMITTED',
      toStatus: 'COMPLETED',
      completedBy: taskRow.assigned_to ?? params.reviewerId,
    });

    const { error: noteError } = await supabase
      .from('tasks')
      .update({
        review_note: comment,
        review_note_kind: comment ? 'APPROVE' : null,
      })
      .eq('id', params.taskId)
      .eq('home_id', scopedHomeId);

    if (noteError) {
      throw noteError;
    }
  } else {
    await updateTaskStatus({
      homeId: scopedHomeId,
      taskId: params.taskId,
      fromStatus: 'SUBMITTED',
      toStatus: 'PENDING',
    });

    const { error: noteError } = await supabase
      .from('tasks')
      .update({
        review_note: comment,
        review_note_kind: 'DISPUTE',
        proof_image_url: null,
      })
      .eq('id', params.taskId)
      .eq('home_id', scopedHomeId);

    if (noteError) {
      throw noteError;
    }
  }

  return data;
}

/**
 * Reopens a closed task in place without duplicating the row.
 */
export async function reopenTask(params: {
  homeId: string;
  taskId: string;
  actorId: string;
}): Promise<Task> {
  const scopedHomeId = requireHomeId(params.homeId);
  const tasks = await listTasksByHome(scopedHomeId);
  const current = tasks.find((task) => task.id === params.taskId);
  if (!current) {
    throw new Error('Tarea no encontrada');
  }

  const updated = await updateTaskStatus({
    homeId: scopedHomeId,
    taskId: params.taskId,
    fromStatus: current.status,
    toStatus: 'PENDING',
  });

  await logHomeActivity({
    homeId: scopedHomeId,
    actorId: params.actorId,
    action: 'TASK_REOPEN',
    entityType: 'task',
    entityId: params.taskId,
    summary: `Reabrió «${current.title}»`,
  });

  return updated;
}

const SWAP_SELECT = `
  *,
  from_profile:profiles!task_swap_requests_from_user_id_fkey (
    id,
    display_name,
    avatar_url
  ),
  to_profile:profiles!task_swap_requests_to_user_id_fkey (
    id,
    display_name,
    avatar_url
  )
`;

/**
 * Lists pending swap requests for a home.
 */
export async function listTaskSwapRequests(homeId: string): Promise<TaskSwapRequestWithProfiles[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_swap_requests')
    .select(SWAP_SELECT)
    .eq('home_id', scopedHomeId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TaskSwapRequestWithProfiles[];
}

/**
 * Asks a roommate to take over a task.
 * Only pending / overdue tasks can be swapped (not after submit/complete).
 */
export async function createTaskSwapRequest(params: {
  homeId: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();

  const { data: task, error: taskLoadError } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('id', params.taskId)
    .eq('home_id', scopedHomeId)
    .single();

  if (taskLoadError) {
    throw taskLoadError;
  }
  if (task.status !== 'PENDING' && task.status !== 'OVERDUE') {
    throw new Error('Solo se pueden intercambiar tareas pendientes (no completadas ni en revisión).');
  }

  const { error } = await supabase.from('task_swap_requests').insert({
    home_id: scopedHomeId,
    task_id: params.taskId,
    from_user_id: params.fromUserId,
    to_user_id: params.toUserId,
    status: 'PENDING',
  });

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error('Ya hay una solicitud de intercambio pendiente.');
    }
    throw error;
  }
}

/**
 * Accepts or rejects a swap. Accepting reassigns the task.
 */
export async function respondToTaskSwap(params: {
  homeId: string;
  requestId: string;
  accept: boolean;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { data: request, error: loadError } = await supabase
    .from('task_swap_requests')
    .select('*')
    .eq('id', params.requestId)
    .eq('home_id', scopedHomeId)
    .single();

  if (loadError) {
    throw loadError;
  }

  const { data: swapTask, error: swapTaskError } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('id', request.task_id)
    .eq('home_id', scopedHomeId)
    .single();

  if (swapTaskError) {
    throw swapTaskError;
  }
  if (params.accept && swapTask.status !== 'PENDING' && swapTask.status !== 'OVERDUE') {
    throw new Error('Esta tarea ya no se puede intercambiar (completada o en revisión).');
  }

  const { error: updateError } = await supabase
    .from('task_swap_requests')
    .update({ status: params.accept ? 'ACCEPTED' : 'REJECTED' })
    .eq('id', params.requestId)
    .eq('home_id', scopedHomeId);

  if (updateError) {
    throw updateError;
  }

  if (!params.accept) {
    return;
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({ assigned_to: request.to_user_id })
    .eq('id', request.task_id)
    .eq('home_id', scopedHomeId);

  if (taskError) {
    throw taskError;
  }

  await syncAssignees({
    homeId: scopedHomeId,
    taskId: request.task_id,
    assigneeIds: [request.to_user_id],
  });
}

async function patchTaskSeriesConfig(params: {
  homeId: string;
  task: TaskWithRelations;
  nextConfig: RecurrenceConfig;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('tasks')
    .update({ recurrence_config: params.nextConfig })
    .eq('id', params.task.id)
    .eq('home_id', params.homeId);
  if (error) {
    throw error;
  }
  if (params.task.template_id) {
    const { error: templateError } = await supabase
      .from('task_templates')
      .update({ recurrence_config: params.nextConfig })
      .eq('id', params.task.template_id)
      .eq('home_id', params.homeId);
    if (templateError) {
      throw templateError;
    }
  }
}

/**
 * Cancels one occurrence: open → SKIPPED (+ spawn); scheduled → skipped_dates exception.
 */
export async function cancelTaskOccurrence(params: {
  homeId: string;
  taskId: string;
  actorId: string;
  /** When set, cancels a projected date instead of the open row. */
  scheduledDueAt?: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const tasks = await listTasksByHome(scopedHomeId);
  const task = tasks.find((item) => item.id === params.taskId);
  if (!task) {
    throw new Error('Tarea no encontrada');
  }

  if (params.scheduledDueAt) {
    const due = new Date(params.scheduledDueAt);
    const config = parseRecurrenceConfig(task.recurrence_config);
    await patchTaskSeriesConfig({
      homeId: scopedHomeId,
      task,
      nextConfig: withSkippedOccurrenceDate(config, due),
    });
    await logHomeActivity({
      homeId: scopedHomeId,
      actorId: params.actorId,
      action: 'TASK_SKIP_DATE',
      entityType: 'task',
      entityId: task.id,
      summary: `Canceló la fecha programada de «${task.title}»`,
    });
    return;
  }

  if (!OPEN_INSTANCE_STATUSES.includes(task.status)) {
    throw new Error('Solo se puede cancelar una tarea abierta o programada');
  }

  await updateTaskStatus({
    homeId: scopedHomeId,
    taskId: task.id,
    fromStatus: task.status,
    toStatus: 'SKIPPED',
  });
  await logHomeActivity({
    homeId: scopedHomeId,
    actorId: params.actorId,
    action: 'TASK_SKIP',
    entityType: 'task',
    entityId: task.id,
    summary: `Canceló esta ejecución de «${task.title}»`,
  });
}

/**
 * Point reassignment: open instance assignees, or scheduled override (no template rotation change).
 */
export async function reassignTaskOccurrence(params: {
  homeId: string;
  taskId: string;
  actorId: string;
  assigneeId: string;
  scheduledDueAt?: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const tasks = await listTasksByHome(scopedHomeId);
  const task = tasks.find((item) => item.id === params.taskId);
  if (!task) {
    throw new Error('Tarea no encontrada');
  }

  const due = params.scheduledDueAt ? new Date(params.scheduledDueAt) : new Date(task.due_at);
  const [absences, members] = await Promise.all([
    listAbsencesByHome(scopedHomeId),
    listHomeMembers(scopedHomeId),
  ]);
  if (isUserAbsentOnDate(absences, params.assigneeId, due)) {
    const name =
      members.find((member) => member.user_id === params.assigneeId)?.profiles?.display_name ??
      'Compañero';
    throw new Error(absentMemberWarning(name));
  }

  if (params.scheduledDueAt) {
    const dueAt = new Date(params.scheduledDueAt);
    const config = parseRecurrenceConfig(task.recurrence_config);
    await patchTaskSeriesConfig({
      homeId: scopedHomeId,
      task,
      nextConfig: withAssigneeOverride(config, dueAt, params.assigneeId),
    });
    await logHomeActivity({
      homeId: scopedHomeId,
      actorId: params.actorId,
      action: 'TASK_REASSIGN_DATE',
      entityType: 'task',
      entityId: task.id,
      summary: `Reasignó una fecha programada de «${task.title}»`,
    });
    return;
  }

  await syncAssignees({
    homeId: scopedHomeId,
    taskId: task.id,
    assigneeIds: [params.assigneeId],
  });
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('tasks')
    .update({ assigned_to: params.assigneeId })
    .eq('id', task.id)
    .eq('home_id', scopedHomeId);
  if (error) {
    throw error;
  }
  await logHomeActivity({
    homeId: scopedHomeId,
    actorId: params.actorId,
    action: 'TASK_REASSIGN',
    entityType: 'task',
    entityId: task.id,
    summary: `Reasignó «${task.title}»`,
  });
}

/**
 * After a punctual absence: reassign open auto_assign tasks in the range to available peers.
 * Returns how many tasks were reassigned (activity events act as in-app notifications).
 */
export async function reassignRotatingTasksForPunctualAbsence(params: {
  homeId: string;
  actorId: string;
  absentUserId: string;
  startDate: string;
  endDate: string;
}): Promise<number> {
  const scopedHomeId = requireHomeId(params.homeId);
  const [tasks, absences, members] = await Promise.all([
    listTasksByHome(scopedHomeId),
    listAbsencesByHome(scopedHomeId),
    listHomeMembers(scopedHomeId),
  ]);

  const candidates = listRotatingTasksInDateRange({
    tasks,
    userId: params.absentUserId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const memberIds = members.map((member) => member.user_id);
  let reassigned = 0;

  for (const task of candidates) {
    if (!task.due_at) {
      continue;
    }
    const dueAt = new Date(task.due_at);
    const nextId = pickReplacementForAbsentAssignee({
      memberIds,
      absentUserId: params.absentUserId,
      absences,
      dueAt,
    });
    if (!nextId) {
      continue;
    }
    await reassignTaskOccurrence({
      homeId: scopedHomeId,
      taskId: task.id,
      actorId: params.actorId,
      assigneeId: nextId,
    });
    const nextName =
      members.find((member) => member.user_id === nextId)?.profiles?.display_name ?? 'un compañero';
    await logHomeActivity({
      homeId: scopedHomeId,
      actorId: params.actorId,
      action: 'TASK_REASSIGN_ABSENCE',
      entityType: 'task',
      entityId: task.id,
      summary: `Por ausencia puntual, «${task.title}» pasó a ${nextName}`,
    });
    reassigned += 1;
  }

  return reassigned;
}
