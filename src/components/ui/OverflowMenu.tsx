import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SafePressable } from '@/components/ui/SafePressable';
import { interactive, mergeStyles, palette } from '@/lib/interactive-styles';

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
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          cssInterop={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar menú"
        />
        <View className="rounded-t-3xl bg-white p-4 pb-8 gap-1">
          {title ? <Text className="text-sm font-semibold text-gray-500 mb-2">{title}</Text> : null}
          {actions.map((action) => (
            <SafePressable
              key={action.key}
              disabled={action.disabled}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              contentStyle={mergeStyles(
                { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
                action.disabled ? interactive.disabled : undefined,
              )}>
              <Text
                className={`text-base font-medium ${action.destructive ? 'text-red-600' : 'text-gray-900'}`}>
                {action.label}
              </Text>
            </SafePressable>
          ))}
          <SafePressable
            onPress={onClose}
            contentStyle={mergeStyles(
              { borderRadius: 12, backgroundColor: palette.gray100, paddingHorizontal: 12, paddingVertical: 12, marginTop: 8 },
            )}>
            <Text className="text-center text-sm font-semibold text-gray-700">Cerrar</Text>
          </SafePressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Compact trigger for overflow menus.
 */
export function OverflowMenuButton({ onPress, label = '⋮' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Más opciones"
      style={styles.menuButton}>
      <Text className="text-lg font-bold text-gray-700">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: palette.gray100,
  },
});
