import { z } from 'zod';

export const shoppingListSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1).max(60),
  rotation_enabled: z.boolean(),
  current_buyer_user_id: z.string().uuid().nullable(),
  expense_id: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const shoppingListItemSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  list_id: z.string().uuid(),
  title: z.string().min(1).max(80),
  needed: z.boolean(),
  sort_order: z.number().int(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ShoppingList = z.infer<typeof shoppingListSchema>;
export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>;

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingListItem[];
  member_ids: string[];
};
