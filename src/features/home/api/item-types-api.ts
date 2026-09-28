import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createItemTypeInputSchema,
  homeItemTypeSchema,
  type CreateItemTypeInput,
  type HomeItemType,
  type ItemTypeDomain,
} from '@/schemas/item-type.schema';

/**
 * Lists custom types for a home, optionally scoped to tasks or expenses.
 */
export async function listItemTypesByHome(
  homeId: string,
  domain?: ItemTypeDomain,
): Promise<HomeItemType[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  let query = supabase
    .from('home_item_types')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('name', { ascending: true });
  if (domain) {
    query = query.eq('domain', domain);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => homeItemTypeSchema.parse(row));
}

/**
 * Creates a custom type for the active home.
 */
export async function createItemType(input: CreateItemTypeInput): Promise<HomeItemType> {
  const parsed = createItemTypeInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_item_types')
    .insert({
      home_id: scopedHomeId,
      domain: parsed.domain,
      name: parsed.name.trim(),
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese tipo ya existe');
    }
    throw error;
  }
  return homeItemTypeSchema.parse(data);
}

/**
 * Deletes a custom type. Rows keep their item_type_id as null (on delete set null).
 */
export async function deleteItemType(homeId: string, typeId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('home_item_types')
    .delete()
    .eq('id', typeId)
    .eq('home_id', scopedHomeId);
  if (error) {
    throw error;
  }
}
