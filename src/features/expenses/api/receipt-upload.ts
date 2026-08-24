import { pickCompressedProofImage } from '@/features/tasks/api/proof-upload';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';

const RECEIPT_BUCKET = 'expense-receipts';

export { pickCompressedProofImage };

/**
 * Uploads a receipt image to Supabase Storage under the home/expense path.
 *
 * @returns Public URL of the uploaded object.
 */
export async function uploadExpenseReceipt(params: {
  homeId: string;
  expenseId: string;
  userId: string;
  localUri: string;
  mimeType?: string;
}): Promise<string> {
  const homeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const path = `${homeId}/${params.expenseId}/${params.userId}-${Date.now()}.jpg`;

  const response = await fetch(params.localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, blob, {
    contentType: params.mimeType ?? 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
