import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

type TaskReviewCommentModalProps = {
  visible: boolean;
  mode: 'APPROVE' | 'DISPUTE';
  busy?: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
};

/**
 * Collects optional approve suggestion or required dispute reason.
 */
export function TaskReviewCommentModal({
  visible,
  mode,
  busy = false,
  onClose,
  onConfirm,
}: TaskReviewCommentModalProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isDispute = mode === 'DISPUTE';

  function handleConfirm() {
    const trimmed = comment.trim();
    if (isDispute && !trimmed) {
      setError('El motivo es obligatorio al impugnar.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        setComment('');
        setError(null);
      }}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable
          className="w-full gap-3 rounded-2xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <Text className="text-lg font-bold text-gray-900">
            {isDispute ? 'Impugnar prueba' : 'Aprobar entrega'}
          </Text>
          <Text className="text-sm text-gray-600">
            {isDispute
              ? 'Explica qué falla para que el compañero pueda corregirlo.'
              : 'Opcional: deja una sugerencia amable al validar la foto.'}
          </Text>
          <TextField
            label={isDispute ? 'Motivo' : 'Sugerencia (opcional)'}
            value={comment}
            onChangeText={setComment}
            placeholder={isDispute ? 'Ej. la encimera sigue manchada' : 'Ej. genial, la próxima con más luz'}
          />
          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
          <Button
            label={isDispute ? 'Impugnar' : 'Aprobar'}
            loading={busy}
            onPress={handleConfirm}
          />
          <Button label="Cancelar" variant="ghost" disabled={busy} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
