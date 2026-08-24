import { homeLeaderboardSchema, type HomeLeaderboardRow } from '@/features/home/lib/leaderboard';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Loads the ranked member list for a home (reputation + task aggregates).
 */
export async function listHomeLeaderboard(homeId: string): Promise<HomeLeaderboardRow[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_home_leaderboard', {
    p_home_id: scopedHomeId,
  });

  if (error) {
    throw error;
  }

  return homeLeaderboardSchema.parse(data ?? []);
}
