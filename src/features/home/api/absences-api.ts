import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  memberAbsenceSchema,
  upsertAbsenceInputSchema,
  type MemberAbsence,
  type UpsertAbsenceInput,
} from '@/schemas/absence.schema';

/**
 * Lists absences for a home, ordered by start date.
 */
export async function listAbsencesByHome(homeId: string): Promise<MemberAbsence[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_absences')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('start_date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => memberAbsenceSchema.parse(row));
}

/**
 * Creates an absence for the current user.
 */
export async function createAbsence(input: UpsertAbsenceInput): Promise<MemberAbsence> {
  const parsed = upsertAbsenceInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    throw new Error('Sesión no disponible');
  }

  const { data, error } = await supabase
    .from('member_absences')
    .insert({
      home_id: scopedHomeId,
      user_id: userId,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      reason: parsed.reason?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberAbsenceSchema.parse(data);
}

/**
 * Updates an absence owned by the current user (or admin).
 */
export async function updateAbsence(
  absenceId: string,
  input: UpsertAbsenceInput,
): Promise<MemberAbsence> {
  const parsed = upsertAbsenceInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_absences')
    .update({
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      reason: parsed.reason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', absenceId)
    .eq('home_id', scopedHomeId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberAbsenceSchema.parse(data);
}

/**
 * Deletes an absence.
 */
export async function deleteAbsence(homeId: string, absenceId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('member_absences')
    .delete()
    .eq('id', absenceId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}
