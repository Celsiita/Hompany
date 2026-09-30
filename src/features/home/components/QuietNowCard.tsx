import { Text, View } from 'react-native';

import { HelpTip } from '@/components/ui/HelpTip';
import { SafePressable } from '@/components/ui/SafePressable';
import { mergeStyles } from '@/lib/interactive-styles';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { toDateKey } from '@/lib/absences';

type QuietNowCardProps = {
  authorName: string;
  busy?: boolean;
  onRequest: (input: {
    kind: 'EVENT';
    title: string;
    starts_on: string;
    ends_on: string;
  }) => Promise<void>;
};

/**
 * Primary CTA to claim quiet for today (calendar EVENT).
 */
export function QuietNowCard({ authorName, busy = false, onRequest }: QuietNowCardProps) {
  const confirm = useConfirmDialog();
  const showToast = useToast();

  async function handleRequest() {
    const ok = await confirm({
      title: '¿Reclamar silencio?',
      message: 'Avisas al piso de que necesitas tranquilidad un rato.',
      confirmLabel: 'Reclamar silencio',
    });
    if (!ok) {
      return;
    }
    const today = toDateKey(new Date());
    try {
      await onRequest({
        kind: 'EVENT',
        title: `🔇 Silencio · ${authorName}`,
        starts_on: today,
        ends_on: today,
      });
      showToast({ message: 'Silencio reclamado', tone: 'success' });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'No se pudo reclamar silencio',
        tone: 'error',
      });
    }
  }

  return (
    <View className="overflow-hidden rounded-3xl border border-violet-300 bg-violet-600">
      <View className="flex-row items-stretch">
        <SafePressable
          onPress={() => void handleRequest()}
          disabled={busy}
          style={{ flex: 1 }}
          contentStyle={mergeStyles({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 16,
            opacity: busy ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Reclamar silencio">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Text className="text-2xl">🔇</Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-base font-bold text-white">
              {busy ? 'Enviando…' : 'Reclamar silencio'}
            </Text>
            <Text className="text-xs leading-4 text-violet-100">
              Avisa al piso · sale hoy en la agenda
            </Text>
          </View>
          <Text className="text-xl font-bold text-white/90">›</Text>
        </SafePressable>
        <View className="justify-center border-l border-white/20 px-3">
          <HelpTip
            title="Reclamar silencio"
            message="Avisa al piso de que necesitas tranquilidad ahora. Sale hoy en la agenda."
          />
        </View>
      </View>
    </View>
  );
}
