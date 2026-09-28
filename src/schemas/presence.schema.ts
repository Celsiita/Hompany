import { z } from 'zod';

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const yearMonthKeySchema = z.string().regex(/^\d{4}-\d{2}-01$/);

export const systemLeaveKindSchema = z.enum(['INDEFINITE', 'PLANNED']);

/**
 * Date range when a member expects to live in the home.
 */
export const memberPresencePeriodSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_date: dateKeySchema,
  end_date: dateKeySchema,
  created_at: z.string(),
});

/**
 * Month row when a member expects to live in the home (legacy).
 */
export const memberPresenceMonthSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  year_month: yearMonthKeySchema,
  created_at: z.string(),
});

/**
 * System-wide leave (indefinite or planned date range).
 */
export const memberSystemLeaveSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: systemLeaveKindSchema,
  start_date: dateKeySchema,
  end_date: dateKeySchema.nullable(),
  reason: z.string().max(200).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const upsertSystemLeaveInputSchema = z
  .object({
    home_id: z.string().uuid(),
    kind: systemLeaveKindSchema,
    start_date: dateKeySchema,
    end_date: dateKeySchema.optional().nullable(),
    reason: z.string().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'INDEFINITE' && value.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La ausencia indefinida no tiene fecha de fin',
        path: ['end_date'],
      });
    }
    if (value.kind === 'PLANNED') {
      if (!value.end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indica la fecha de fin',
          path: ['end_date'],
        });
      } else if (value.end_date < value.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin debe ser igual o posterior al inicio',
          path: ['end_date'],
        });
      }
    }
  });

export type MemberPresencePeriod = z.infer<typeof memberPresencePeriodSchema>;
export type MemberPresenceMonth = z.infer<typeof memberPresenceMonthSchema>;
export type MemberSystemLeave = z.infer<typeof memberSystemLeaveSchema>;
export type UpsertSystemLeaveInput = z.infer<typeof upsertSystemLeaveInputSchema>;
export type SystemLeaveKind = z.infer<typeof systemLeaveKindSchema>;
