import { z } from 'zod';

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Zod schema for a member exam period row.
 */
export const memberExamPeriodSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_date: dateKeySchema,
  end_date: dateKeySchema,
  label: z.string().min(1).max(80),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Payload for creating or updating an exam period.
 */
export const upsertExamPeriodInputSchema = z
  .object({
    home_id: z.string().uuid(),
    start_date: dateKeySchema,
    end_date: dateKeySchema,
    label: z.string().min(1).max(80),
  })
  .refine((value) => value.end_date >= value.start_date, {
    message: 'La fecha de fin debe ser igual o posterior al inicio',
    path: ['end_date'],
  });

export type MemberExamPeriod = z.infer<typeof memberExamPeriodSchema>;
export type UpsertExamPeriodInput = z.infer<typeof upsertExamPeriodInputSchema>;
