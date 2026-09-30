import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
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
 * One-tap “need quiet right now” — distinct from exam silence mode (date ranges).
 * Creates a same-day calendar event so roommates see it on Agenda.
 */
export function QuietNowCard({ authorName, busy = false, onRequest }: QuietNowCardProps) {
  const confirm = useConfirmDialog();
  const showToast = useToast();

  async function handleRequest() {
    const ok = await confirm({
      title: '¿Pedir silencio ahora?',
      message:
        'Avisas al piso de que necesitas tranquilidad un rato. No es el modo exámenes: solo un aviso de hoy.',
      confirmLabel: 'Pedir silencio',
    });
    if (!ok) {
      return;
    }
    const today = toDateKey(new Date());
    try {
      await onRequest({
        kind: 'EVENT',
        title: `🔇 Silencio ahora · ${authorName}`,
        starts_on: today,
        ends_on: today,
      });
      showToast({ message: 'Pedido de silencio enviado al piso', tone: 'success' });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'No se pudo pedir silencio',
        tone: 'error',
      });
    }
  }

  return (
    <View className="gap-2 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
      <Text className="text-sm font-bold text-violet-950">Silencio ahora</Text>
      <Text className="text-sm leading-5 text-violet-900/80">
        ¿Necesitas tranquilidad ya? Avisa al piso. Distinto del modo silencio de exámenes (ese lo
        marcas tú en fechas, sin pedir permiso).
      </Text>
      <Button
        label="Pedir silencio ahora"
        variant="secondary"
        loading={busy}
        onPress={() => void handleRequest()}
      />
    </View>
  );
}
