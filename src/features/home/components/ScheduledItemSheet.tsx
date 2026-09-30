import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import type { AgendaItem } from '@/features/home/lib/agenda-items';
import { formatDueSummary } from '@/features/tasks/lib/countdown';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { absentMemberWarning, isUserAbsentOnDate } from '@/lib/absences';
import { mascotReaction } from '@/lib/mascot';
import type { MemberAbsence } from '@/schemas/absence.schema';

type ScheduledItemSheetProps = {
  visible: boolean;
  item: AgendaItem | null;
  members: HomeMemberWithProfile[];
  absences?: MemberAbsence[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  busy?: boolean;
  onClose: () => void;
  onCancelDate?: () => void;
  onReassign?: (userId: string) => void;
  onRequestSwap?: () => void;
  onOpenBoard?: () => void;
};

/**
 * Bottom sheet for a scheduled (projected) occurrence — attenuated details + point actions.
 */
export function ScheduledItemSheet({
  visible,
  item,
  members,
  absences = [],
  currentUserId,
  isAdmin = false,
  busy = false,
  onClose,
  onCancelDate,
  onReassign,
  onRequestSwap,
  onOpenBoard,
}: ScheduledItemSheetProps) {
  const [reassignError, setReassignError] = useState<string | null>(null);

  if (!item) {
    return null;
  }

  const isTask = item.kind === 'task';
  const isAssignee = Boolean(currentUserId && item.assignedUserId === currentUserId);
  const isCreditor = Boolean(!isTask && currentUserId && item.assignedUserId === currentUserId);
  const canCancel = isTask ? isAdmin : isCreditor;
  const canReassign = isTask ? isAdmin : isCreditor;
  const canSwap = isTask && isAssignee && onRequestSwap;
  const preview = formatDueSummary(item.when.toISOString(), item.dueMode);

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[80%]" animationType="fade">
      <Text className="text-xs font-semibold uppercase text-stone-400">Programada</Text>
      <Text className="mt-1 text-lg font-bold text-stone-800 opacity-80">
        {item.glyph} {item.title}
      </Text>
      <Text className="mt-1 text-sm text-stone-500">
        {isTask ? 'Tarea' : 'Gasto'} · {item.actorLabel} · {preview.label}
      </Text>
      <Text className="mt-2 text-xs text-stone-500">
        Vista previa: aún no se puede completar. Cuando llegue el día, la verás abierta en el tablero.
      </Text>

      <View className="mt-4">
        {canReassign && onReassign ? (
          <View className="mb-3 gap-2">
            <Text className="text-sm font-semibold text-stone-800">
              {isTask ? 'Reasignar esta fecha' : 'Reasignar acreedor (esta fecha)'}
            </Text>
            {members.map((member) => {
              const selected = member.user_id === item.assignedUserId;
              const name = member.profiles?.display_name ?? 'Compañero';
              const absent = isUserAbsentOnDate(absences, member.user_id, item.when);
              return (
                <Pressable
                  key={member.id}
                  disabled={busy}
                  onPress={() => {
                    if (absent) {
                      setReassignError(absentMemberWarning(name));
                      return;
                    }
                    setReassignError(null);
                    onReassign(member.user_id);
                  }}
                  className={`rounded-xl border px-3 py-3 ${
                    selected ? 'border-blue-400 bg-blue-50' : 'border-stone-200 bg-white'
                  }`}>
                  <Text className="text-sm font-medium text-stone-900">{name}</Text>
                  <Text className="text-sm text-teal-700">{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
            {reassignError ? <Text className="text-xs text-amber-700">{reassignError}</Text> : null}
          </View>
        ) : null}

        {canSwap ? (
          <View className="mb-3">
            <Button
              label={mascotReaction('swap').button}
              variant="secondary"
              loading={busy}
              onPress={onRequestSwap}
            />
          </View>
        ) : null}

        {canCancel && onCancelDate ? (
          <View className="mb-3">
            <Button label="Cancelar esta fecha" variant="secondary" loading={busy} onPress={onCancelDate} />
          </View>
        ) : null}

        {item.lifecycle === 'open' && onOpenBoard ? (
          <Button label="Abrir en el tablero" onPress={onOpenBoard} />
        ) : null}
      </View>

      <Pressable onPress={onClose} className="mt-3 rounded-xl bg-stone-100 px-3 py-3">
        <Text className="text-center text-sm font-semibold text-stone-700">Cerrar</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
