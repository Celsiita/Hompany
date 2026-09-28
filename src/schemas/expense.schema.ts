import { dueModeSchema, recurrenceConfigSchema, recurrenceKindSchema } from '@/lib/recurrence';
import { z } from 'zod';

import { EXPENSE_KIND_VALUES, EXPENSE_STATUS } from '@/types/expense';

export const expenseKindSchema = z.enum(EXPENSE_KIND_VALUES);
export const expenseStatusSchema = z.enum(['OPEN', 'SETTLED', 'ARCHIVED', 'SKIPPED']);
export const expenseRecurrenceSchema = recurrenceKindSchema;
export const expenseSplitModeSchema = z.enum(['EQUAL', 'PERCENT', 'AMOUNT']);
export type ExpenseSplitMode = z.infer<typeof expenseSplitModeSchema>;

/**
 * Zod schema for an expenses row.
 */
export const expenseSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  kind: expenseKindSchema,
  item_type_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().min(1),
  paid_by: z.string().uuid(),
  status: expenseStatusSchema,
  receipt_image_url: z.string().nullable(),
  recurrence: expenseRecurrenceSchema,
  base_title: z.string().nullable(),
  series_id: z.string().uuid().nullable(),
  due_at: z.string().datetime({ offset: true }),
  due_mode: dueModeSchema.default('DEADLINE'),
  starts_at: z.string().datetime({ offset: true }).nullable().optional(),
  all_day: z.boolean().default(false),
  completed_at: z.string().nullable(),
  recurrence_config: recurrenceConfigSchema,
  auto_assign: z.boolean(),
  split_mode: expenseSplitModeSchema.default('EQUAL'),
  created_at: z.string(),
  updated_at: z.string(),
});

export const expenseShareInputSchema = z.object({
  user_id: z.string().uuid(),
  share_percent: z.number().min(0).max(100).optional(),
  share_amount: z.number().nonnegative().optional(),
});

/**
 * Payload for creating or updating an expense with debtor shares.
 */
export const upsertExpenseInputSchema = z
  .object({
    home_id: z.string().uuid(),
    title: z.string().min(1).max(80),
    description: z.string().max(400).optional(),
    kind: expenseKindSchema,
    item_type_id: z.string().uuid().nullable().optional(),
    amount: z.number().nonnegative().max(100000),
    paid_by: z.string().uuid(),
    debtor_ids: z.array(z.string().uuid()).min(1),
    include_payer_in_split: z.boolean().default(true),
    split_mode: expenseSplitModeSchema.default('EQUAL'),
    share_inputs: z.array(expenseShareInputSchema).optional(),
    receipt_image_url: z.union([z.string().url(), z.null()]).optional(),
    recurrence: expenseRecurrenceSchema.default('ONCE'),
    recurrence_config: recurrenceConfigSchema.default({}),
    due_at: z.string().datetime({ offset: true }),
    due_mode: dueModeSchema.default('DEADLINE'),
    starts_at: z.string().datetime({ offset: true }).optional(),
    all_day: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.split_mode === 'EQUAL') {
      return;
    }
    if (!value.share_inputs || value.share_inputs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indica la parte de cada participante',
        path: ['share_inputs'],
      });
    }
  });

export type UpsertExpenseInput = z.infer<typeof upsertExpenseInputSchema>;

export const expenseKindFilterSchema = z.union([
  z.enum(['ALL', 'GROCERY', 'HOUSE', 'PEER']),
  z.string().uuid(),
]);

export const expenseStatusFilterSchema = z.enum(['OPEN', 'SETTLED']);

export const expenseInvolvementFilterSchema = z.enum(['ALL', 'I_OWE', 'THEY_OWE_ME']);

export type ExpenseKindFilter = z.infer<typeof expenseKindFilterSchema>;
export type ExpenseStatusFilter = z.infer<typeof expenseStatusFilterSchema>;
export type ExpenseInvolvementFilter = z.infer<typeof expenseInvolvementFilterSchema>;

export { EXPENSE_STATUS };
