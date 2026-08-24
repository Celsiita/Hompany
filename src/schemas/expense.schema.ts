import { dueModeSchema, recurrenceConfigSchema, recurrenceKindSchema } from '@/lib/recurrence';
import { z } from 'zod';

import { EXPENSE_KIND_VALUES, EXPENSE_STATUS } from '@/types/expense';

export const expenseKindSchema = z.enum(EXPENSE_KIND_VALUES);
export const expenseStatusSchema = z.enum(['OPEN', 'SETTLED', 'ARCHIVED']);
export const expenseRecurrenceSchema = recurrenceKindSchema;

/**
 * Zod schema for an expenses row.
 */
export const expenseSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  kind: expenseKindSchema,
  amount: z.coerce.number().nonnegative(),
  currency: z.string().min(1),
  paid_by: z.string().uuid(),
  status: expenseStatusSchema,
  receipt_image_url: z.string().nullable(),
  recurrence: expenseRecurrenceSchema,
  base_title: z.string().nullable(),
  series_id: z.string().uuid().nullable(),
  due_at: z.string().nullable(),
  due_mode: dueModeSchema.default('DEADLINE'),
  completed_at: z.string().nullable(),
  recurrence_config: recurrenceConfigSchema,
  auto_assign: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Payload for creating or updating an expense with debtor shares.
 */
export const upsertExpenseInputSchema = z.object({
  home_id: z.string().uuid(),
  title: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  kind: expenseKindSchema,
  amount: z.number().nonnegative().max(100000),
  paid_by: z.string().uuid(),
  debtor_ids: z.array(z.string().uuid()).min(1),
  include_payer_in_split: z.boolean().default(true),
  receipt_image_url: z.string().url().nullable().optional(),
  recurrence: expenseRecurrenceSchema.default('ONCE'),
  recurrence_config: recurrenceConfigSchema.default({}),
  due_at: z.string().datetime({ offset: true }).nullable().optional(),
  due_mode: dueModeSchema.default('DEADLINE'),
});

export type UpsertExpenseInput = z.infer<typeof upsertExpenseInputSchema>;

export const expenseKindFilterSchema = z.enum([
  'ALL',
  'GROCERY',
  'HOUSE',
  'PEER',
]);

export const expenseStatusFilterSchema = z.enum(['OPEN', 'SETTLED']);

export const expenseInvolvementFilterSchema = z.enum(['ALL', 'I_OWE', 'THEY_OWE_ME']);

export type ExpenseKindFilter = z.infer<typeof expenseKindFilterSchema>;
export type ExpenseStatusFilter = z.infer<typeof expenseStatusFilterSchema>;
export type ExpenseInvolvementFilter = z.infer<typeof expenseInvolvementFilterSchema>;

export { EXPENSE_STATUS };
