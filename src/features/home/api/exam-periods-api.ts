import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  memberExamPeriodSchema,
  upsertExamPeriodInputSchema,
  type MemberExamPeriod,
  type UpsertExamPeriodInput,
} from '@/schemas/exam-period.schema';

/**
 * Lists exam periods for a home, ordered by start date.
 */
export async function listExamPeriodsByHome(homeId: string): Promise<MemberExamPeriod[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_exam_periods')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('start_date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => memberExamPeriodSchema.parse(row));
}

/**
 * Creates an exam period for the current user.
 */
export async function createExamPeriod(input: UpsertExamPeriodInput): Promise<MemberExamPeriod> {
  const parsed = upsertExamPeriodInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    throw new Error('Sesión no disponible');
  }

  const { data, error } = await supabase
    .from('member_exam_periods')
    .insert({
      home_id: scopedHomeId,
      user_id: userId,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      label: parsed.label.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberExamPeriodSchema.parse(data);
}

/**
 * Updates an exam period owned by the current user (or admin).
 */
export async function updateExamPeriod(
  periodId: string,
  input: UpsertExamPeriodInput,
): Promise<MemberExamPeriod> {
  const parsed = upsertExamPeriodInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('member_exam_periods')
    .update({
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      label: parsed.label.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)
    .eq('home_id', scopedHomeId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return memberExamPeriodSchema.parse(data);
}

/**
 * Deletes an exam period.
 */
export async function deleteExamPeriod(homeId: string, periodId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('member_exam_periods')
    .delete()
    .eq('id', periodId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}
