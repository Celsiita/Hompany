import { z } from 'zod';

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Zod schema for a member absence row.
 */
export const memberAbsenceSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_date: dateKeySchema,
  end_date: dateKeySchema,
  reason: z.string().max(200).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Payload for creating or updating an absence range.
 */
export const upsertAbsenceInputSchema = z
  .object({
    home_id: z.string().uuid(),
    start_date: dateKeySchema,
    end_date: dateKeySchema,
    reason: z.string().max(200).optional(),
  })
  .refine((value) => value.end_date >= value.start_date, {
    message: 'La fecha de fin debe ser igual o posterior al inicio',
    path: ['end_date'],
  });

export type MemberAbsence = z.infer<typeof memberAbsenceSchema>;
export type UpsertAbsenceInput = z.infer<typeof upsertAbsenceInputSchema>;
