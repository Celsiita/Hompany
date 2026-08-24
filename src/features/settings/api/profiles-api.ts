import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database.types';

/**
 * Loads a public profile by user id.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates the authenticated user's display name. RLS enforces own-row only.
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<Profile> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
