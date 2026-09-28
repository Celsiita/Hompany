import { lastDateKeyOfMonth } from '@/lib/presence';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  memberPresencePeriodSchema,
  memberSystemLeaveSchema,
  upsertSystemLeaveInputSchema,
  type MemberPresencePeriod,
  type MemberSystemLeave,
  type UpsertSystemLeaveInput,
} from '@/schemas/presence.schema';

/**
 * Lists presence periods for a home.
 */
export async function listPresencePeriodsByHome(homeId: string): Promise<MemberPresencePeriod[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_presence_periods')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('start_date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => memberPresencePeriodSchema.parse(row));
}

/**
 * Adds a presence date range for the current user.
 */
export async function addPresencePeriod(params: {
  homeId: string;
  startDate: string;
  endDate: string;
}): Promise<MemberPresencePeriod> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    throw new Error('Sesión no disponible');
  }

  const { data, error } = await supabase
    .from('member_presence_periods')
    .insert({
      home_id: scopedHomeId,
      user_id: userId,
      start_date: params.startDate,
      end_date: params.endDate,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberPresencePeriodSchema.parse(data);
}

/**
 * Adds a full calendar month as a presence period.
 */
export async function addPresenceMonth(params: {
  homeId: string;
  yearMonth: string;
}): Promise<MemberPresencePeriod> {
  return addPresencePeriod({
    homeId: params.homeId,
    startDate: params.yearMonth,
    endDate: lastDateKeyOfMonth(params.yearMonth),
  });
}

/**
 * Removes a presence period.
 */
export async function removePresencePeriod(params: {
  homeId: string;
  periodId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('member_presence_periods')
    .delete()
    .eq('id', params.periodId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Removes a full-month presence period for the current user.
 */
export async function removePresenceMonth(params: {
  homeId: string;
  yearMonth: string;
  userId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const endDate = lastDateKeyOfMonth(params.yearMonth);

  const { error } = await supabase
    .from('member_presence_periods')
    .delete()
    .eq('home_id', scopedHomeId)
    .eq('user_id', params.userId)
    .eq('start_date', params.yearMonth)
    .eq('end_date', endDate);

  if (error) {
    throw error;
  }
}

/**
 * Lists system leaves for a home.
 */
export async function listSystemLeavesByHome(homeId: string): Promise<MemberSystemLeave[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_system_leaves')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('start_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => memberSystemLeaveSchema.parse(row));
}

/**
 * Creates a system leave for the current user.
 */
export async function createSystemLeave(input: UpsertSystemLeaveInput): Promise<MemberSystemLeave> {
  const parsed = upsertSystemLeaveInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    throw new Error('Sesión no disponible');
  }

  const { data, error } = await supabase
    .from('member_system_leaves')
    .insert({
      home_id: scopedHomeId,
      user_id: userId,
      kind: parsed.kind,
      start_date: parsed.start_date,
      end_date: parsed.kind === 'INDEFINITE' ? null : parsed.end_date ?? null,
      reason: parsed.reason?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberSystemLeaveSchema.parse(data);
}

/**
 * Deletes a system leave.
 */
export async function deleteSystemLeave(homeId: string, leaveId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('member_system_leaves')
    .delete()
    .eq('id', leaveId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}
