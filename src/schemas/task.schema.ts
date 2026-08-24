import { dueModeSchema, recurrenceConfigSchema, recurrenceKindSchema } from '@/lib/recurrence';
import { z } from 'zod';

import { TASK_CATEGORY_VALUES, TASK_ICON_OPTIONS } from '@/types/task-category';
import { taskStatusSchema } from '@/schemas/task-status.schema';

export const taskCategorySchema = z.enum(TASK_CATEGORY_VALUES);
export const taskRecurrenceSchema = recurrenceKindSchema;
export const taskIconSchema = z.enum(TASK_ICON_OPTIONS);

/**
 * Zod schema for a tasks row including category metadata.
 */
export const taskSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: taskStatusSchema,
  category: taskCategorySchema,
  icon: z.string().min(1),
  recurrence: taskRecurrenceSchema,
  is_template: z.boolean(),
  template_id: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  base_title: z.string().nullable(),
  auto_assign: z.boolean(),
  recurrence_config: recurrenceConfigSchema,
  assigned_to: z.string().uuid().nullable(),
  completed_by: z.string().uuid().nullable(),
  due_at: z.string(),
  due_mode: dueModeSchema.default('DEADLINE'),
  completed_at: z.string().nullable(),
  proof_image_url: z.string().nullable(),
  points_value: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Payload for creating or updating a task.
 */
export const upsertTaskInputSchema = z.object({
  home_id: z.string().uuid(),
  title: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  category: taskCategorySchema.default('QUICK'),
  icon: z.string().min(1).default('checklist'),
  recurrence: taskRecurrenceSchema.default('ONCE'),
  due_at: z.string().datetime({ offset: true }),
  due_mode: dueModeSchema.default('DEADLINE'),
  points_value: z.number().int().min(0).max(100).default(10),
  assignee_ids: z.array(z.string().uuid()).default([]),
  auto_assign: z.boolean().default(false),
  recurrence_config: recurrenceConfigSchema.default({}),
});

export const createTaskInputSchema = upsertTaskInputSchema;

export type UpsertTaskInput = z.infer<typeof upsertTaskInputSchema>;
export type CreateTaskInput = UpsertTaskInput;

export const upsertTaskTemplateInputSchema = upsertTaskInputSchema.omit({ due_at: true });
export type UpsertTaskTemplateInput = z.infer<typeof upsertTaskTemplateInputSchema>;

export const taskBoardCategoryFilterSchema = z.enum(['ALL', 'ZONE', 'QUICK']);

export const taskAssigneeScopeSchema = z.enum(['ALL', 'MINE', 'OTHERS']);

export type TaskBoardCategoryFilter = z.infer<typeof taskBoardCategoryFilterSchema>;
export type TaskAssigneeScope = z.infer<typeof taskAssigneeScopeSchema>;
export type TaskRecurrence = z.infer<typeof taskRecurrenceSchema>;
