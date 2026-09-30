import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useLocale } from '@/providers/LocaleProvider';

type ProofSourceModalProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (source: 'camera' | 'library' | null) => void;
  /** Home setting: photo required to complete. */
  proofRequired?: boolean;
  /** Home setting: gallery disallowed. */
  cameraOnly?: boolean;
};

/**
 * Chooses camera, gallery (optional) or skip before completing a task.
 */
export function ProofSourceModal({
  visible,
  onClose,
  onPick,
  proofRequired = false,
  cameraOnly = false,
}: ProofSourceModalProps) {
  const { t } = useLocale();
  const body = proofRequired
    ? cameraOnly
      ? t('proof.requiredCamera')
      : t('proof.requiredAny')
    : cameraOnly
      ? t('proof.optionalCamera')
      : t('proof.optionalAny');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onClose}>
        <Pressable
          className="w-full gap-3 rounded-2xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-lg font-bold text-stone-900">{t('proof.title')}</Text>
          <Text className="text-sm text-stone-600">{body}</Text>
          <Button label={t('proof.openCamera')} onPress={() => onPick('camera')} />
          {!cameraOnly ? (
            <Button
              label={t('proof.pickGallery')}
              variant="secondary"
              onPress={() => onPick('library')}
            />
          ) : null}
          {!proofRequired ? (
            <Button
              label={t('proof.skip')}
              variant="secondary"
              onPress={() => onPick(null)}
            />
          ) : null}
          <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
