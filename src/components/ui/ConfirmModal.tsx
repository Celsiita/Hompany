import { Modal, Pressable, Text, View } from 'react-native';

export type ConfirmTone = 'danger' | 'neutral';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Blocking confirmation sheet for destructive or irreversible actions.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-center bg-black/40 px-6" onPress={onCancel}>
        <Pressable
          className="rounded-2xl bg-white p-5 gap-3"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
          <Text className="text-sm leading-5 text-gray-600">{message}</Text>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-xl bg-gray-100 py-3">
              <Text className="text-center text-sm font-semibold text-gray-800">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 rounded-xl py-3 ${tone === 'danger' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <Text className="text-center text-sm font-semibold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
