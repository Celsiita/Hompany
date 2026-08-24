import { Modal, Pressable, Text, View } from 'react-native';

export type OverflowMenuAction = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type OverflowMenuProps = {
  visible: boolean;
  title?: string;
  actions: OverflowMenuAction[];
  onClose: () => void;
};

/**
 * Contextual ⋮ action sheet.
 */
export function OverflowMenu({ visible, title, actions, onClose }: OverflowMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white p-4 pb-8 gap-1" onPress={(event) => event.stopPropagation()}>
          {title ? <Text className="text-sm font-semibold text-gray-500 mb-2">{title}</Text> : null}
          {actions.map((action) => (
            <Pressable
              key={action.key}
              disabled={action.disabled}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              className={`rounded-xl px-3 py-3 ${action.disabled ? 'opacity-40' : ''}`}>
              <Text
                className={`text-base font-medium ${action.destructive ? 'text-red-600' : 'text-gray-900'}`}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} className="rounded-xl bg-gray-100 px-3 py-3 mt-2">
            <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Compact trigger for overflow menus.
 */
export function OverflowMenuButton({ onPress, label = '⋮' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Más opciones"
      className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
      <Text className="text-lg font-bold text-gray-700">{label}</Text>
    </Pressable>
  );
}
