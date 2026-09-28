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
  wifi_ssid: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  wifi_password: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  portal_code: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  bin_day: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  notes: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  proof_mode: z
    .enum(['OPTIONAL', 'REQUIRED'])
    .nullish()
    .transform((value) => value ?? 'OPTIONAL'),
  proof_capture: z
    .enum(['CAMERA_OR_GALLERY', 'CAMERA_ONLY'])
    .nullish()
    .transform((value) => value ?? 'CAMERA_OR_GALLERY'),
});

/**
 * Payload to update shared practical flat info (Feed card).
 */
export const updateHomePracticalInfoSchema = z.object({
  wifi_ssid: z.string().max(120),
  wifi_password: z.string().max(120),
  portal_code: z.string().max(80),
  bin_day: z.string().max(200),
  notes: z.string().max(1000),
});

export type UpdateHomePracticalInfoInput = z.infer<typeof updateHomePracticalInfoSchema>;

/**
 * Payload to update flat-wide proof photo policy (admin RPC).
 */
export const updateHomeProofSettingsSchema = z.object({
  proof_mode: z.enum(['OPTIONAL', 'REQUIRED']),
  proof_capture: z.enum(['CAMERA_OR_GALLERY', 'CAMERA_ONLY']),
});

export type UpdateHomeProofSettingsInput = z.infer<typeof updateHomeProofSettingsSchema>;
export type HomeProofMode = UpdateHomeProofSettingsInput['proof_mode'];
export type HomeProofCapture = UpdateHomeProofSettingsInput['proof_capture'];

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
