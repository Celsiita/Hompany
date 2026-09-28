import { z } from 'zod';

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Notice kinds: feed (RULE/COMPLAINT) or agenda calendar (VISIT/REPAIR/EVENT).
 */
export const homeNoticeKindSchema = z.enum([
  'RULE',
  'COMPLAINT',
  'VISIT',
  'REPAIR',
  'EVENT',
]);

export const FEED_NOTICE_KINDS = ['RULE', 'COMPLAINT'] as const;
export const CALENDAR_NOTICE_KINDS = ['VISIT', 'REPAIR', 'EVENT'] as const;

/**
 * Zod schema for a home_notices row.
 */
export const homeNoticeSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  kind: homeNoticeKindSchema,
  title: z.string().min(1),
  body: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  is_anonymous: z.boolean(),
  author_id: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  starts_on: dateKeySchema.nullish().transform((value) => value ?? null),
  ends_on: dateKeySchema.nullish().transform((value) => value ?? null),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Payload for creating a feed or calendar notice.
 */
export const createHomeNoticeInputSchema = z
  .object({
    home_id: z.string().uuid(),
    kind: homeNoticeKindSchema,
    title: z.string().trim().min(1, 'Escribe un título').max(200),
    body: z.string().trim().max(2000).optional(),
    is_anonymous: z.boolean().optional(),
    starts_on: dateKeySchema.optional(),
    ends_on: dateKeySchema.optional(),
  })
  .superRefine((value, ctx) => {
    const isCalendar = (CALENDAR_NOTICE_KINDS as readonly string[]).includes(value.kind);
    if (isCalendar) {
      if (!value.starts_on || !value.ends_on) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Las visitas, reparaciones y eventos necesitan fechas',
          path: ['starts_on'],
        });
        return;
      }
      if (value.ends_on < value.starts_on) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de fin debe ser igual o posterior al inicio',
          path: ['ends_on'],
        });
      }
    }
  });

export type HomeNoticeKind = z.infer<typeof homeNoticeKindSchema>;
export type HomeNotice = z.infer<typeof homeNoticeSchema>;
export type CreateHomeNoticeInput = z.infer<typeof createHomeNoticeInputSchema>;
export type FeedNoticeKind = (typeof FEED_NOTICE_KINDS)[number];
export type CalendarNoticeKind = (typeof CALENDAR_NOTICE_KINDS)[number];
