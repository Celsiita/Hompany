import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { categoryLabel } from '@/features/tasks/components/TaskFilterBar';
import { recurrenceLabel } from '@/features/tasks/lib/recurrence';
import type { TaskTemplateWithRelations } from '@/types/database.types';

type TemplateCardProps = {
  template: TaskTemplateWithRelations;
  busy?: boolean;
  onUse?: (template: TaskTemplateWithRelations) => void;
  onEdit?: (template: TaskTemplateWithRelations) => void;
  onDelete?: (template: TaskTemplateWithRelations) => void;
};

const ICON_GLYPH: Record<string, string> = {
  'fork.knife': '🍽',
  shower: '🚿',
  sofa: '🛋',
  trash: '🗑',
  roll: '🧻',
  cart: '🛒',
  checklist: '✅',
  broom: '🧹',
};

/**
 * Saved-task card for the Guardadas library.
 */
export function TemplateCard({
  template,
  busy = false,
  onUse,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Text className="text-xl">{ICON_GLYPH[template.icon] ?? '✅'}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold text-gray-900">{template.title}</Text>
            <Text className="text-xs font-medium text-blue-700">
              {categoryLabel(template.category)} · {recurrenceLabel(template.recurrence)}
            </Text>
            {template.description ? (
              <Text className="text-sm text-gray-600">{template.description}</Text>
            ) : null}
          </View>
        </View>
        <View className="rounded-full bg-gray-100 px-3 py-1">
          <Text className="text-xs font-semibold text-gray-700">
            {template.points_value} pts
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row -space-x-2">
          {template.task_template_assignees.length === 0 ? (
            <Text className="text-xs text-gray-500">Sin asignar</Text>
          ) : (
            template.task_template_assignees.slice(0, 4).map((assignee) => (
              <View
                key={assignee.id}
                className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-100">
                <Text className="text-xs font-bold text-blue-800">
                  {(assignee.profiles?.display_name ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {onUse ? (
        <Button
          label={template.recurrence === 'ONCE' ? 'Usar de nuevo' : 'Reactivar'}
          loading={busy}
          onPress={() => onUse(template)}
        />
      ) : null}

      {(onEdit || onDelete) ? (
        <View className="flex-row gap-3">
          {onEdit ? (
            <Pressable onPress={() => onEdit(template)}>
              <Text className="text-sm font-semibold text-blue-700">Editar</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={() => onDelete(template)}>
              <Text className="text-sm font-semibold text-red-600">Eliminar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
