import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onClose}>
        <Pressable
          className="w-full gap-3 rounded-2xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-lg font-bold text-gray-900">Entregar prueba</Text>
          <Text className="text-sm text-gray-600">
            {proofRequired
              ? cameraOnly
                ? 'Este piso exige foto hecha con la cámara (sin galería).'
                : 'Este piso exige una foto de prueba (cámara o galería).'
              : cameraOnly
                ? 'Puedes adjuntar una foto con la cámara o completar sin ella.'
                : 'La foto es opcional: cámara, galería o completar sin foto.'}
          </Text>
          <Button label="Abrir cámara" onPress={() => onPick('camera')} />
          {!cameraOnly ? (
            <Button
              label="Elegir de galería"
              variant="secondary"
              onPress={() => onPick('library')}
            />
          ) : null}
          {!proofRequired ? (
            <Button
              label="Completar sin foto"
              variant="secondary"
              onPress={() => onPick(null)}
            />
          ) : null}
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
