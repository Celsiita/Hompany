import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Home, HomeMember, Profile } from '@/types/database.types';
import { homeSchema } from '@/schemas/home.schema';

export type HomeMemberWithProfile = HomeMember & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
};

/**
 * Lists homes where the current authenticated user is a member.
 */
export async function listMyHomes(): Promise<Home[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('homes').select('*').order('created_at', {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lists members of a home with profile display data.
 */
export async function listHomeMembers(homeId: string): Promise<HomeMemberWithProfile[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('home_members')
    .select(
      `
      *,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq('home_id', scopedHomeId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as HomeMemberWithProfile[];
}

/**
 * Creates a home and owner membership via security-definer RPC.
 */
export async function createHome(name: string): Promise<Home> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('create_home', { p_name: name });

  if (error) {
    throw error;
  }

  return homeSchema.parse(data);
}

/**
 * Promotes or demotes a member (admin-only RPC).
 */
export async function setHomeMemberRole(params: {
  homeId: string;
  userId: string;
  role: 'admin' | 'member';
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('set_home_member_role', {
    p_home_id: scopedHomeId,
    p_user_id: params.userId,
    p_role: params.role,
  });

  if (error) {
    throw error;
  }
}

/**
 * Joins an existing home using its invite code via security-definer RPC.
 */
export async function joinHomeByInviteCode(inviteCode: string): Promise<Home> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('join_home_by_invite_code', {
    p_code: inviteCode,
  });

  if (error) {
    throw error;
  }

  return homeSchema.parse(data);
}

/**
 * Current user leaves the home. Last owner transfers or the empty home is removed.
 */
export async function leaveHome(homeId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('leave_home', { p_home_id: scopedHomeId });
  if (error) {
    throw error;
  }
}

/**
 * Admin removes another member from the home.
 */
export async function kickHomeMember(homeId: string, userId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('kick_home_member', {
    p_home_id: scopedHomeId,
    p_user_id: userId,
  });
  if (error) {
    throw error;
  }
}

/**
 * Permanently deletes the authenticated account and its memberships.
 */
export async function deleteOwnAccount(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    throw error;
  }
}
