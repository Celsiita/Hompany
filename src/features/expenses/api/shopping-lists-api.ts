import { createExpense } from '@/features/expenses/api/expenses-api';
import { defaultDueAtForMode } from '@/lib/recurrence';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  shoppingListItemSchema,
  shoppingListSchema,
  type ShoppingList,
  type ShoppingListItem,
  type ShoppingListWithItems,
} from '@/schemas/shopping-list.schema';

/**
 * Lists shopping lists with items and member ids for a home.
 * When `viewerUserId` is set, only lists shared with that user are returned.
 */
export async function listShoppingListsByHome(
  homeId: string,
  viewerUserId?: string | null,
): Promise<ShoppingListWithItems[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data: lists, error } = await supabase
    .from('home_shopping_lists')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const { data: items, error: itemsError } = await supabase
    .from('home_shopping_list_items')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw itemsError;
  }

  const { data: members, error: membersError } = await supabase
    .from('home_shopping_list_members')
    .select('list_id, user_id')
    .eq('home_id', scopedHomeId);

  if (membersError) {
    throw membersError;
  }

  const parsedLists = (lists ?? []).map((row) => shoppingListSchema.parse(row));
  const parsedItems = (items ?? []).map((row) => shoppingListItemSchema.parse(row));
  const membersByList = new Map<string, string[]>();
  for (const row of members ?? []) {
    const current = membersByList.get(row.list_id) ?? [];
    current.push(row.user_id);
    membersByList.set(row.list_id, current);
  }

  return parsedLists
    .map((list) => ({
      ...list,
      expense_id: list.expense_id ?? null,
      items: parsedItems.filter((item) => item.list_id === list.id),
      member_ids: membersByList.get(list.id) ?? [],
    }))
    .filter((list) => {
      if (!viewerUserId) {
        return true;
      }
      if (list.member_ids.length === 0) {
        return true;
      }
      return list.member_ids.includes(viewerUserId);
    });
}

async function replaceListMembers(params: {
  homeId: string;
  listId: string;
  memberIds: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('home_shopping_list_members')
    .delete()
    .eq('home_id', params.homeId)
    .eq('list_id', params.listId);

  if (deleteError) {
    throw deleteError;
  }

  if (params.memberIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('home_shopping_list_members').insert(
    params.memberIds.map((userId) => ({
      home_id: params.homeId,
      list_id: params.listId,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

/**
 * Creates a list with members and a controlled linked expense.
 */
export async function createShoppingList(params: {
  homeId: string;
  name: string;
  memberIds: string[];
  paidBy: string;
  amount?: number;
  createdBy?: string | null;
}): Promise<ShoppingList> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const name = params.name.trim();
  const memberIds = Array.from(new Set(params.memberIds));
  if (memberIds.length === 0) {
    throw new Error('Elige con quién se comparte la lista');
  }

  const debtors = memberIds.filter((id) => id !== params.paidBy);
  const expense = await createExpense({
    home_id: scopedHomeId,
    title: name,
    kind: 'GROCERY',
    amount: params.amount ?? 0,
    paid_by: params.paidBy,
    debtor_ids: debtors.length > 0 ? debtors : [params.paidBy],
    include_payer_in_split: true,
    split_mode: 'EQUAL',
    due_at: defaultDueAtForMode('DEADLINE').toISOString(),
    due_mode: 'DEADLINE',
    all_day: false,
    recurrence: 'ONCE',
    recurrence_config: {},
  });

  const { data, error } = await supabase
    .from('home_shopping_lists')
    .insert({
      home_id: scopedHomeId,
      name,
      created_by: params.createdBy ?? null,
      expense_id: expense.id,
      current_buyer_user_id: params.paidBy,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const list = shoppingListSchema.parse(data);
  await replaceListMembers({
    homeId: scopedHomeId,
    listId: list.id,
    memberIds,
  });
  return list;
}

/**
 * Replaces who shares the list.
 */
export async function setShoppingListMembers(params: {
  homeId: string;
  listId: string;
  memberIds: string[];
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const memberIds = Array.from(new Set(params.memberIds));
  if (memberIds.length === 0) {
    throw new Error('Debe haber al menos un participante');
  }
  await replaceListMembers({
    homeId: scopedHomeId,
    listId: params.listId,
    memberIds,
  });
}

/**
 * Links or clears the controlled expense for a list.
 */
export async function setShoppingListExpense(params: {
  homeId: string;
  listId: string;
  expenseId: string | null;
}): Promise<ShoppingList> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_shopping_lists')
    .update({
      expense_id: params.expenseId,
      updated_at: new Date().toISOString(),
    })
    .eq('home_id', scopedHomeId)
    .eq('id', params.listId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return shoppingListSchema.parse(data);
}

/**
 * Creates a controlled expense for a list that has none yet.
 */
export async function ensureShoppingListExpense(params: {
  homeId: string;
  list: ShoppingListWithItems;
  paidBy: string;
  amount?: number;
}): Promise<ShoppingList> {
  if (params.list.expense_id) {
    return params.list;
  }
  const memberIds =
    params.list.member_ids.length > 0 ? params.list.member_ids : [params.paidBy];
  const debtors = memberIds.filter((id) => id !== params.paidBy);
  const expense = await createExpense({
    home_id: params.homeId,
    title: params.list.name,
    kind: 'GROCERY',
    amount: params.amount ?? 0,
    paid_by: params.paidBy,
    debtor_ids: debtors.length > 0 ? debtors : [params.paidBy],
    include_payer_in_split: true,
    split_mode: 'EQUAL',
    due_at: defaultDueAtForMode('DEADLINE').toISOString(),
    due_mode: 'DEADLINE',
    all_day: false,
    recurrence: 'ONCE',
    recurrence_config: {},
  });
  try {
    return await setShoppingListExpense({
      homeId: params.homeId,
      listId: params.list.id,
      expenseId: expense.id,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' &&
            err !== null &&
            'message' in err &&
            typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Error al vincular';
    throw new Error(
      `Gasto creado pero no vinculado a la lista. Aplica la migración de listas (${message}).`,
    );
  }
}

/**
 * Adds an item marked as needed.
 */
export async function addShoppingListItem(params: {
  homeId: string;
  listId: string;
  title: string;
  createdBy?: string | null;
}): Promise<ShoppingListItem> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_shopping_list_items')
    .insert({
      home_id: scopedHomeId,
      list_id: params.listId,
      title: params.title.trim(),
      needed: true,
      created_by: params.createdBy ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return shoppingListItemSchema.parse(data);
}

/**
 * Toggles whether an item is still needed.
 */
export async function setShoppingItemNeeded(params: {
  homeId: string;
  itemId: string;
  needed: boolean;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('home_shopping_list_items')
    .update({ needed: params.needed, updated_at: new Date().toISOString() })
    .eq('home_id', scopedHomeId)
    .eq('id', params.itemId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a shopping list item.
 */
export async function deleteShoppingListItem(params: {
  homeId: string;
  itemId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('home_shopping_list_items')
    .delete()
    .eq('home_id', scopedHomeId)
    .eq('id', params.itemId);

  if (error) {
    throw error;
  }
}

/**
 * Enables/disables buyer rotation and optionally advances the buyer.
 */
export async function updateShoppingListRotation(params: {
  homeId: string;
  listId: string;
  rotationEnabled: boolean;
  currentBuyerUserId?: string | null;
}): Promise<ShoppingList> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_shopping_lists')
    .update({
      rotation_enabled: params.rotationEnabled,
      current_buyer_user_id: params.currentBuyerUserId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('home_id', scopedHomeId)
    .eq('id', params.listId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return shoppingListSchema.parse(data);
}

/**
 * Counts needed items across all lists (for alerts).
 */
export function countNeededShoppingItems(lists: ShoppingListWithItems[]): number {
  return lists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.needed).length,
    0,
  );
}
