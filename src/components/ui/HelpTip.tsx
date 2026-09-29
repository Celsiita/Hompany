import { useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type HelpTipProps = {
  title: string;
  message: string;
  /** Compact trigger for headers; default "?". */
  label?: string;
  children?: ReactNode;
};

/**
 * Inline "?" that opens a short explanation sheet (Shipaton clarity).
 */
export function HelpTip({ title, message, label = '?', children }: HelpTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Ayuda: ${title}`}
        className="h-7 w-7 items-center justify-center rounded-full border border-teal-200 bg-teal-50">
        {children ?? <Text className="text-xs font-bold text-teal-800">{label}</Text>}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setOpen(false)} accessibilityLabel="Cerrar" />
          <View className="rounded-t-3xl bg-white px-5 pb-10 pt-4 gap-3">
            <View className="items-center pb-1">
              <View className="h-1 w-10 rounded-full bg-stone-300" />
            </View>
            <Text className="text-lg font-bold text-stone-900">{title}</Text>
            <Text className="text-sm leading-5 text-stone-600">{message}</Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="mt-1 rounded-xl bg-teal-700 px-4 py-3">
              <Text className="text-center text-sm font-semibold text-white">Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
