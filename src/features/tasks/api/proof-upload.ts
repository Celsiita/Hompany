import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';

const PROOF_BUCKET = 'task-proofs';

/**
 * Opens camera or gallery, compresses the image, and returns a local URI + mime.
 */
export async function pickCompressedProofImage(
  source: 'camera' | 'library',
): Promise<{ uri: string; mimeType: string } | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permiso de cámara/galería denegado');
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
  );

  return { uri: manipulated.uri, mimeType: 'image/jpeg' };
}

/**
 * Uploads a local proof image to Supabase Storage under the home/task path.
 *
 * @returns Public URL of the uploaded object.
 */
export async function uploadTaskProof(params: {
  homeId: string;
  taskId: string;
  userId: string;
  localUri: string;
  mimeType?: string;
}): Promise<string> {
  const homeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const extension = 'jpg';
  const path = `${homeId}/${params.taskId}/${params.userId}-${Date.now()}.${extension}`;

  const response = await fetch(params.localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, blob, {
    contentType: params.mimeType ?? 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
