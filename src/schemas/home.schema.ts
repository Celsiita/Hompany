import { z } from 'zod';

/**
 * Zod schema for home_member_role enum values.
 */
export const homeMemberRoleSchema = z.enum(['owner', 'admin', 'member']);

/**
 * Zod schema for a home row returned from Supabase.
 */
export const homeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  invite_code: z.string().min(1),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Zod schema for a home_members row.
 */
export const homeMemberSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: homeMemberRoleSchema,
  reputation_points: z.number().int().min(0).max(1000),
  joined_at: z.string(),
});

export type HomeSchema = z.infer<typeof homeSchema>;
export type HomeMemberSchema = z.infer<typeof homeMemberSchema>;
