import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createHomeNoticeInputSchema,
  homeNoticeSchema,
  type CreateHomeNoticeInput,
  type HomeNotice,
} from '@/schemas/home-notice.schema';

/**
 * Lists notices for a home (feed + calendar), newest first.
 */
export async function listHomeNotices(homeId: string): Promise<HomeNotice[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('home_notices')
    .select('*')
    .eq('home_id', scopedHomeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => homeNoticeSchema.parse(row));
}

/**
 * Creates a notice authored by the current user (anonymous flag hides author in UI).
 */
export async function createHomeNotice(input: CreateHomeNoticeInput): Promise<HomeNotice> {
  const parsed = createHomeNoticeInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    throw new Error('Sesión no disponible');
  }

  const isCalendar = parsed.kind === 'VISIT' || parsed.kind === 'REPAIR' || parsed.kind === 'EVENT';

  const { data, error } = await supabase
    .from('home_notices')
    .insert({
      home_id: scopedHomeId,
      kind: parsed.kind,
      title: parsed.title.trim(),
      body: parsed.body?.trim() || null,
      is_anonymous: parsed.is_anonymous ?? false,
      author_id: userId,
      starts_on: isCalendar ? (parsed.starts_on ?? null) : null,
      ends_on: isCalendar ? (parsed.ends_on ?? null) : null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return homeNoticeSchema.parse(data);
}

/**
 * Deletes a notice (author or admin via RLS).
 */
export async function deleteHomeNotice(homeId: string, noticeId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('home_notices')
    .delete()
    .eq('id', noticeId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}
