import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { HelpTip } from '@/components/ui/HelpTip';
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
 * One-tap quiet claim for today (calendar EVENT). Help tip explains; no long copy.
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
    <View className="flex-row items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/80 px-3 py-3">
      <View className="min-w-0 flex-1">
        <Button
          label="Reclamar silencio"
          variant="secondary"
          loading={busy}
          onPress={() => void handleRequest()}
        />
      </View>
      <HelpTip
        title="Reclamar silencio"
        message="Avisa al piso de que necesitas tranquilidad ahora. Sale hoy en la agenda."
      />
    </View>
  );
}
