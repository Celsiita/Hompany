import { z } from 'zod';

export const itemTypeDomainSchema = z.enum(['task', 'expense']);

export const homeItemTypeSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  domain: itemTypeDomainSchema,
  name: z.string().min(1).max(40),
  created_at: z.string(),
});

export const createItemTypeInputSchema = z.object({
  home_id: z.string().uuid(),
  domain: itemTypeDomainSchema,
  name: z.string().trim().min(1).max(40),
});

export type HomeItemType = z.infer<typeof homeItemTypeSchema>;
export type ItemTypeDomain = z.infer<typeof itemTypeDomainSchema>;
export type CreateItemTypeInput = z.infer<typeof createItemTypeInputSchema>;
