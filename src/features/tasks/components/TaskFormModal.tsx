import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { DueDateFields } from '@/components/ui/DueDateFields';
import { RecurrenceEditor } from '@/components/ui/RecurrenceEditor';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { glyphForTaskIcon } from '@/lib/icons/packs';
import {
  computeInitialDueAt,
  defaultDueAtForMode,
  ensureRecurrenceConfigDefaults,
  parseRecurrenceConfig,
  stripCycleSuffix,
  syncRecurrenceConfigFromDate,
  type DueMode,
  type RecurrenceConfig,
} from '@/lib/recurrence';
import { useIconPack } from '@/providers/IconPackProvider';
import type { UpsertTaskInput } from '@/schemas/task.schema';
import {
  TASK_BOARD_CATEGORY,
  TASK_CATEGORY_LABEL,
  TASK_ICON_OPTIONS,
} from '@/types/task-category';
import type { TaskWithRelations } from '@/types/database.types';

type TaskFormModalProps = {
  visible: boolean;
  members: HomeMemberWithProfile[];
  initialTask?: TaskWithRelations | null;
  mode?: 'create' | 'edit' | 'repeat';
  onClose: () => void;
  onSubmit: (input: Omit<UpsertTaskInput, 'home_id'>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

/**
 * Modal CRUD form for creating or editing a task.
 */
export function TaskFormModal({
  visible,
  members,
  initialTask,
  mode = 'create',
  onClose,
  onSubmit,
  onDelete,
}: TaskFormModalProps) {
  const { pack } = useIconPack();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<UpsertTaskInput['category']>('QUICK');
  const [icon, setIcon] = useState<string>('checklist');
  const [recurrence, setRecurrence] = useState<UpsertTaskInput['recurrence']>('ONCE');
  const [dueMode, setDueMode] = useState<DueMode>('DEADLINE');
  const [dueAt, setDueAt] = useState(() => defaultDueAtForMode('DEADLINE'));
  const [points, setPoints] = useState('10');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [autoAssign, setAutoAssign] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (initialTask) {
      setTitle(stripCycleSuffix(initialTask.base_title ?? initialTask.title));
      setDescription(initialTask.description ?? '');
      setCategory(initialTask.category === 'GROCERY' ? 'QUICK' : initialTask.category);
      setIcon(initialTask.icon);
      setRecurrence(initialTask.recurrence);
      setDueMode(initialTask.due_mode ?? 'DEADLINE');
      setPoints(String(initialTask.points_value));
      setAssigneeIds(initialTask.task_assignees.map((item) => item.user_id));
      setAutoAssign(Boolean(initialTask.auto_assign));
      setRecurrenceConfig(parseRecurrenceConfig(initialTask.recurrence_config));
      setDueAt(new Date(initialTask.due_at));
    } else {
      setTitle('');
      setDescription('');
      setCategory('QUICK');
      setIcon('checklist');
      setRecurrence('ONCE');
      setDueMode('DEADLINE');
      setPoints('10');
      setAssigneeIds([]);
      setAutoAssign(false);
      setRecurrenceConfig({});
      setDueAt(defaultDueAtForMode('DEADLINE'));
    }
    setError(null);
  }, [visible, initialTask]);

  function applyRecurrence(next: UpsertTaskInput['recurrence']) {
    setRecurrence(next);
    if (next === 'ONCE') {
      return;
    }
    const seeded = ensureRecurrenceConfigDefaults(next, recurrenceConfig, dueAt);
    setRecurrenceConfig(seeded);
    setDueAt(computeInitialDueAt(next, seeded, new Date(), dueMode));
  }

  function applyDueMode(next: DueMode) {
    setDueMode(next);
    if (recurrence !== 'ONCE') {
      setDueAt(computeInitialDueAt(recurrence, recurrenceConfig, new Date(), next));
    }
  }

  function applyConfig(next: RecurrenceConfig) {
    const seeded =
      recurrence === 'ONCE' ? next : ensureRecurrenceConfigDefaults(recurrence, next, dueAt);
    setRecurrenceConfig(seeded);
    if (recurrence !== 'ONCE') {
      setDueAt(computeInitialDueAt(recurrence, seeded, new Date(), dueMode));
    }
  }

  function handleDueAtChange(next: Date) {
    if (recurrence === 'ONCE') {
      setDueAt(next);
      return;
    }
    const synced = syncRecurrenceConfigFromDate(recurrence, next, recurrenceConfig);
    setRecurrenceConfig(synced);
    setDueAt(next);
  }

  function toggleAssignee(userId: string) {
    setAssigneeIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (recurrence === 'WEEKLY' && !recurrenceConfig.day_of_week) {
      setError('Elige el día de la semana');
      return;
    }
    if (
      recurrence === 'MONTHLY' &&
      (recurrenceConfig.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' &&
      !recurrenceConfig.day_of_month
    ) {
      setError('Elige el día del mes');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        recurrence,
        due_at: dueAt.toISOString(),
        due_mode: dueMode,
        points_value: Number(points) || 10,
        assignee_ids: assigneeIds,
        auto_assign: autoAssign,
        recurrence_config: recurrenceConfig,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[90%] w-full rounded-t-3xl bg-white p-4"
          onPress={(event) => event.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-xl font-bold text-gray-900 mb-3">
              {mode === 'edit' ? 'Editar tarea' : mode === 'repeat' ? 'Repetir tarea' : 'Nueva tarea'}
            </Text>

            <View className="gap-3">
              <TextField label="Título" value={title} onChangeText={setTitle} />
              <TextField
                label="Descripción"
                value={description}
                onChangeText={setDescription}
              />

              <Text className="text-sm font-medium text-gray-700">Tipo</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(TASK_BOARD_CATEGORY) as Array<keyof typeof TASK_BOARD_CATEGORY>).map(
                  (key) => {
                    const value = TASK_BOARD_CATEGORY[key];
                    const active = category === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setCategory(value)}
                        className={`rounded-full px-3 py-2 ${active ? 'bg-blue-600' : 'bg-gray-100'}`}>
                        <Text
                          className={
                            active
                              ? 'text-white text-xs font-semibold'
                              : 'text-gray-700 text-xs font-semibold'
                          }>
                          {TASK_CATEGORY_LABEL[value]}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>

              <Text className="text-sm font-medium text-gray-700">Icono</Text>
              <View className="flex-row flex-wrap gap-2">
                {TASK_ICON_OPTIONS.map((option) => {
                  const active = icon === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setIcon(option)}
                      accessibilityRole="button"
                      accessibilityLabel={option}
                      accessibilityState={{ selected: active }}
                      className={`h-11 w-11 items-center justify-center rounded-xl ${active ? 'border border-blue-400 bg-blue-100' : 'border border-gray-200 bg-gray-50'}`}>
                      <Text className="text-xl">{glyphForTaskIcon(pack, option)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <RecurrenceEditor
                recurrence={recurrence}
                config={recurrenceConfig}
                onRecurrenceChange={applyRecurrence}
                onConfigChange={applyConfig}
              />

              <DueDateFields
                dueMode={dueMode}
                dueAt={dueAt}
                recurrence={recurrence}
                recurrenceConfig={recurrenceConfig}
                onDueModeChange={applyDueMode}
                onDueAtChange={handleDueAtChange}
              />

              <TextField
                label="Puntos"
                keyboardType="number-pad"
                value={points}
                onChangeText={setPoints}
              />

              <Text className="text-sm font-medium text-gray-700">Asignados</Text>
              <View className="gap-2">
                {members.map((member) => {
                  const selected = assigneeIds.includes(member.user_id);
                  const name = member.profiles?.display_name ?? member.user_id.slice(0, 6);
                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => toggleAssignee(member.user_id)}
                      className={`flex-row items-center justify-between rounded-xl border px-3 py-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                      <Text className="text-sm font-medium text-gray-900">{name}</Text>
                      <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => setAutoAssign((value) => !value)}
                className={`rounded-xl border px-3 py-3 ${autoAssign ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <Text className="text-sm font-medium text-gray-900">
                  {autoAssign ? '✓ ' : ''}Adjudicación automática
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Rota al siguiente compañero cada vez que se genere la tarea.
                </Text>
              </Pressable>

              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

              <View className="mb-4 flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="secondary" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button label="Guardar" loading={loading} onPress={() => void handleSubmit()} />
                </View>
              </View>

              {mode === 'edit' && onDelete ? (
                <Pressable
                  onPress={() => void onDelete()}
                  className="mb-6 rounded-xl border border-red-200 py-3">
                  <Text className="text-center text-sm font-semibold text-red-600">Eliminar tarea</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
