import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { HomeActivityEventWithActor, Json } from '@/types/database.types';

export type LogHomeActivityInput = {
  homeId: string;
  actorId: string;
  action: string;
  entityType: 'task' | 'expense' | 'member' | 'recurrence';
  entityId?: string | null;
  summary: string;
  payload?: Json;
};

/**
 * Writes an immutable history movement (admin action, repeat or reopen).
 */
export async function logHomeActivity(input: LogHomeActivityInput): Promise<void> {
  const scopedHomeId = requireHomeId(input.homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('home_activity_events').insert({
    home_id: scopedHomeId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
    payload: input.payload ?? {},
  });

  if (error) {
    throw error;
  }
}

/**
 * Lists activity events for a home, newest first.
 */
export async function listHomeActivity(homeId: string): Promise<HomeActivityEventWithActor[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('home_activity_events')
    .select(
      `
      *,
      actor:profiles!home_activity_events_actor_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq('home_id', scopedHomeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as HomeActivityEventWithActor[];
}
