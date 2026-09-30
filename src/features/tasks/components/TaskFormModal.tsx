import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { ItemTypePicker } from '@/components/ui/ItemTypePicker';
import { ScheduleEditor } from '@/components/ui/ScheduleEditor';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { absentMemberWarning, isUserAbsentOnDate } from '@/lib/absences';
import { glyphForTaskIcon } from '@/lib/icons/packs';
import {
  defaultScheduleWindow,
  ensureRecurrenceConfigDefaults,
  monthlyDays,
  parseRecurrenceConfig,
  startOfLocalDay,
  stripCycleSuffix,
  validateScheduleRangeAgainstRecurrence,
  weeklyDays,
  yearlyMonths,
  type RecurrenceConfig,
} from '@/lib/recurrence';
import { useIconPack } from '@/providers/IconPackProvider';
import type { HomeItemType } from '@/schemas/item-type.schema';
import type { UpsertTaskInput } from '@/schemas/task.schema';
import { TASK_CATEGORY_LABEL, TASK_ICON_OPTIONS } from '@/types/task-category';
import type { TaskWithRelations } from '@/types/database.types';
import type { MemberAbsence } from '@/schemas/absence.schema';
import { useLocale } from '@/providers/LocaleProvider';

type TaskFormModalProps = {
  visible: boolean;
  members: HomeMemberWithProfile[];
  absences?: MemberAbsence[];
  customTypes?: HomeItemType[];
  onCreateType?: (name: string) => Promise<HomeItemType | void>;
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
  absences = [],
  customTypes = [],
  onCreateType,
  initialTask,
  mode = 'create',
  onClose,
  onSubmit,
  onDelete,
}: TaskFormModalProps) {
  const { t } = useLocale();
  const { pack } = useIconPack();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<UpsertTaskInput['category']>('QUICK');
  const [itemTypeId, setItemTypeId] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>('checklist');
  const [recurrence, setRecurrence] = useState<UpsertTaskInput['recurrence']>('ONCE');
  const [startsAt, setStartsAt] = useState(() => defaultScheduleWindow().startsAt);
  const [dueAt, setDueAt] = useState(() => defaultScheduleWindow().dueAt);
  const [allDay, setAllDay] = useState(true);
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
      setCategory('QUICK');
      setItemTypeId(initialTask.item_type_id ?? null);
      setIcon(initialTask.icon);
      setRecurrence(initialTask.recurrence);
      setPoints(String(initialTask.points_value));
      setAssigneeIds(initialTask.task_assignees.map((item) => item.user_id));
      setAutoAssign(Boolean(initialTask.auto_assign));
      setRecurrenceConfig(parseRecurrenceConfig(initialTask.recurrence_config));
      setDueAt(new Date(initialTask.due_at));
      setStartsAt(
        initialTask.starts_at
          ? new Date(initialTask.starts_at)
          : startOfLocalDay(new Date(initialTask.due_at)),
      );
      setAllDay(Boolean(initialTask.all_day));
    } else {
      setTitle('');
      setDescription('');
      setCategory('QUICK');
      setItemTypeId(null);
      setIcon('checklist');
      setRecurrence('ONCE');
      setPoints('10');
      setAssigneeIds([]);
      setAutoAssign(false);
      setRecurrenceConfig({});
      const window = defaultScheduleWindow();
      setStartsAt(window.startsAt);
      setDueAt(window.dueAt);
      setAllDay(true);
    }
    setError(null);
  }, [visible, initialTask]);

  function applyRecurrence(next: UpsertTaskInput['recurrence']) {
    setRecurrence(next);
    if (next === 'ONCE') {
      return;
    }
    const seeded = ensureRecurrenceConfigDefaults(next, recurrenceConfig, startsAt);
    setRecurrenceConfig(seeded);
  }

  function applyConfig(next: RecurrenceConfig) {
    const seeded =
      recurrence === 'ONCE'
        ? next
        : ensureRecurrenceConfigDefaults(recurrence, next, startsAt);
    setRecurrenceConfig(seeded);
  }

  function handleStartsAtChange(next: Date) {
    setStartsAt(next);
  }

  function handleDueAtChange(next: Date) {
    setDueAt(next);
  }

  function toggleAssignee(userId: string) {
    const adding = !assigneeIds.includes(userId);
    if (adding && !autoAssign && isUserAbsentOnDate(absences, userId, dueAt)) {
      const name =
        members.find((member) => member.user_id === userId)?.profiles?.display_name ??
        t('common.roommate');
      setError(absentMemberWarning(name));
      return;
    }
    setError(null);
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
    if (!autoAssign) {
      const absentAssignee = assigneeIds.find((userId) =>
        isUserAbsentOnDate(absences, userId, dueAt),
      );
      if (absentAssignee) {
        const name =
          members.find((member) => member.user_id === absentAssignee)?.profiles?.display_name ??
          t('common.roommate');
        setError(absentMemberWarning(name));
        return;
      }
    }
    if (recurrence === 'WEEKLY' && weeklyDays(recurrenceConfig).length === 0) {
      setError('Elige al menos un día de la semana');
      return;
    }
    if (
      recurrence === 'MONTHLY' &&
      (recurrenceConfig.due_day_type ?? 'SPECIFIC_DAY') === 'SPECIFIC_DAY' &&
      monthlyDays(recurrenceConfig).length === 0
    ) {
      setError('Elige al menos un día del mes');
      return;
    }
    if (recurrence === 'YEARLY' && yearlyMonths(recurrenceConfig, startsAt).length === 0) {
      setError('Elige al menos un mes');
      return;
    }
    const rangeError = validateScheduleRangeAgainstRecurrence({
      startsAt,
      dueAt,
      recurrence,
      recurrenceConfig,
    });
    if (rangeError) {
      setError(rangeError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'QUICK',
        item_type_id: itemTypeId,
        icon,
        recurrence,
        starts_at: startsAt.toISOString(),
        due_at: dueAt.toISOString(),
        due_mode: 'DEADLINE',
        all_day: allDay,
        points_value: Number(points) || 10,
        assignee_ids: assigneeIds,
        auto_assign: autoAssign,
        recurrence_config: recurrenceConfig,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.saveFail'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <Text className="mb-3 text-xl font-bold text-stone-900">
        {mode === 'edit'
          ? t('task.edit')
          : mode === 'repeat'
            ? t('common.repeat')
            : t('task.new')}
      </Text>

      <View className="gap-3">
              <TextField label={t('common.title')} value={title} onChangeText={setTitle} />
              <TextField
                label={t('form.description')}
                value={description}
                onChangeText={setDescription}
              />

              <Text className="text-sm font-medium text-stone-700">Tipo</Text>
              <ItemTypePicker
                builtin={[{ key: 'QUICK', label: TASK_CATEGORY_LABEL.QUICK }]}
                customTypes={customTypes}
                value={itemTypeId ?? 'QUICK'}
                onChange={(next) => setItemTypeId(next === 'QUICK' ? null : next)}
                onCreate={async (name) => {
                  if (!onCreateType) {
                    return;
                  }
                  return onCreateType(name);
                }}
              />

              <Text className="text-sm font-medium text-stone-700">Icono</Text>
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
                      className={`h-11 w-11 items-center justify-center rounded-xl ${active ? 'border border-blue-400 bg-blue-100' : 'border border-stone-200 bg-stone-50'}`}>
                      <Text className="text-xl">{glyphForTaskIcon(pack, option)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScheduleEditor
                startsAt={startsAt}
                dueAt={dueAt}
                allDay={allDay}
                onStartsAtChange={handleStartsAtChange}
                onDueAtChange={handleDueAtChange}
                onAllDayChange={setAllDay}
                recurrence={recurrence}
                recurrenceConfig={recurrenceConfig}
                onRecurrenceChange={applyRecurrence}
                onConfigChange={applyConfig}
              />

              <TextField
                label={t('task.points')}
                keyboardType="number-pad"
                value={points}
                onChangeText={setPoints}
              />

              <Text className="text-sm font-medium text-stone-700">Quién la hace</Text>
              <View className="gap-2">
                {members.map((member) => {
                  const selected = assigneeIds.includes(member.user_id);
                  const name = member.profiles?.display_name ?? member.user_id.slice(0, 6);
                  const absent =
                    !autoAssign && isUserAbsentOnDate(absences, member.user_id, dueAt);
                  const showAbsentWarning = selected && absent;
                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => toggleAssignee(member.user_id)}
                      className={`rounded-xl border px-3 py-3 ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-stone-200 bg-white'
                      }`}>
                      <Text className="text-sm font-medium text-stone-900">{name}</Text>
                      {showAbsentWarning ? (
                        <Text className="mt-1 text-xs text-amber-700">
                          {absentMemberWarning(name)}
                        </Text>
                      ) : (
                        <Text className="text-sm text-blue-700">{selected ? '✓ Asignado' : 'Tocar'}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => setAutoAssign((value) => !value)}
                className={`rounded-xl border px-3 py-3 ${autoAssign ? 'border-blue-500 bg-blue-50' : 'border-stone-200 bg-white'}`}>
                <Text className="text-sm font-medium text-stone-900">
                  {autoAssign ? '✓ ' : ''}Rotación automática
                </Text>
                <Text className="text-xs text-stone-500 mt-1">
                  Cada ciclo toca al siguiente compañero de la lista.
                </Text>
              </Pressable>

              {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

              <View className="mb-4 flex-row gap-2">
                <View className="flex-1">
                  <Button label={t('common.cancel')} variant="secondary" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button label={t('common.save')} loading={loading} onPress={() => void handleSubmit()} />
                </View>
              </View>

              {mode === 'edit' && onDelete ? (
                <Pressable
                  onPress={() => void onDelete()}
                  className="mb-6 rounded-xl border border-red-200 py-3">
                  <Text className="text-center text-sm font-semibold text-red-600">{t('task.deleteTitle')}</Text>
                </Pressable>
              ) : null}
      </View>
    </BottomSheetModal>
  );
}
