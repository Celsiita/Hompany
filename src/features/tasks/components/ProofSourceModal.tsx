import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

type ProofSourceModalProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (source: 'camera' | 'library' | null) => void;
};

/**
 * Chooses camera, gallery or skip (proof is optional) before completing a task.
 */
export function ProofSourceModal({ visible, onClose, onPick }: ProofSourceModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onClose}>
        <Pressable
          className="w-full gap-3 rounded-2xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-lg font-bold text-gray-900">Completar tarea</Text>
          <Text className="text-sm text-gray-600">
            La foto de prueba es opcional. Puedes adjuntarla o marcar la tarea como entregada sin
            ella.
          </Text>
          <Button label="Abrir cámara" onPress={() => onPick('camera')} />
          <Button label="Elegir de galería" variant="secondary" onPress={() => onPick('library')} />
          <Button label="Completar sin foto" variant="secondary" onPress={() => onPick(null)} />
          <Button label="Cancelar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
