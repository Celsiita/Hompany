import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { InfoTip } from '@/components/ui/InfoTip';
import { SafePressable } from '@/components/ui/SafePressable';
import { TextField } from '@/components/ui/TextField';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { formatAppError } from '@/lib/error-message';
import { interactive, mergeStyles } from '@/lib/interactive-styles';
import type { ShoppingListWithItems } from '@/schemas/shopping-list.schema';
import type { ExpenseWithRelations } from '@/types/database.types';

type ShoppingListsPanelProps = {
  lists: ShoppingListWithItems[];
  members: HomeMemberWithProfile[];
  expenses?: ExpenseWithRelations[];
  currentUserId?: string | null;
  isLoading?: boolean;
  onAddList: (input: { name: string; memberIds: string[]; amount?: number }) => Promise<void>;
  onAddItem: (listId: string, title: string) => Promise<void>;
  onToggleNeeded: (itemId: string, needed: boolean) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onSetRotation: (listId: string, enabled: boolean, buyerUserId?: string | null) => Promise<void>;
  onSetMembers: (listId: string, memberIds: string[]) => Promise<void>;
  /** Creates a controlled expense when missing; returns its id. */
  onEnsureExpense: (listId: string, amount?: number) => Promise<string>;
  /** Opens/focuses an expense on the board after refresh. */
  onOpenExpense: (expenseId: string) => Promise<void>;
};

const INFO =
  'Cada lista tiene un gasto vinculado y participantes elegidos. Marca lo que falta; la rotación elige quién compra.';

/**
 * Shared shopping / supply lists on the Expenses tab.
 */
export function ShoppingListsPanel({
  lists,
  members,
  expenses = [],
  currentUserId,
  isLoading = false,
  onAddList,
  onAddItem,
  onToggleNeeded,
  onRemoveItem,
  onSetRotation,
  onSetMembers,
  onEnsureExpense,
  onOpenExpense,
}: ShoppingListsPanelProps) {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListAmount, setNewListAmount] = useState('');
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeList = useMemo(() => {
    if (lists.length === 0) {
      return null;
    }
    return lists.find((list) => list.id === selectedListId) ?? lists[0];
  }, [lists, selectedListId]);

  const linkedExpense = useMemo(() => {
    if (!activeList?.expense_id) {
      return null;
    }
    return expenses.find((expense) => expense.id === activeList.expense_id) ?? null;
  }, [activeList?.expense_id, expenses]);

  const hasLinkedExpenseId = Boolean(activeList?.expense_id);
  const neededCount = lists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.needed).length,
    0,
  );

  const memberName = (userId: string | null | undefined) =>
    members.find((member) => member.user_id === userId)?.profiles?.display_name ?? 'Compañero';

  function toggleNewMember(userId: string) {
    setNewMemberIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function resetAddForm() {
    setAddFormOpen(false);
    setNewListName('');
    setNewListAmount('');
    setNewMemberIds([]);
  }

  async function handleAddList() {
    const name = newListName.trim();
    if (!name) {
      setError('Pon un nombre a la lista');
      return;
    }
    const memberIds =
      newMemberIds.length > 0
        ? newMemberIds
        : currentUserId
          ? [currentUserId, ...members.map((m) => m.user_id).filter((id) => id !== currentUserId)]
          : members.map((member) => member.user_id);
    if (memberIds.length === 0) {
      setError('Elige con quién se comparte la lista');
      return;
    }
    const amountRaw = newListAmount.trim().replace(',', '.');
    const amount = amountRaw ? Number(amountRaw) : 0;
    if (amountRaw && (!Number.isFinite(amount) || amount < 0)) {
      setError('Importe no válido');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAddList({ name, memberIds, amount });
      resetAddForm();
    } catch (err) {
      setError(formatAppError(err, 'No se pudo crear'));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItem() {
    if (!activeList) {
      return;
    }
    const title = newItemTitle.trim();
    if (!title) {
      setError('Escribe qué falta');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAddItem(activeList.id, title);
      setNewItemTitle('');
    } catch (err) {
      setError(formatAppError(err, 'No se pudo añadir'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleMemberOnActive(userId: string) {
    if (!activeList) {
      return;
    }
    const next = activeList.member_ids.includes(userId)
      ? activeList.member_ids.filter((id) => id !== userId)
      : [...activeList.member_ids, userId];
    if (next.length === 0) {
      setError('Debe quedar al menos un participante');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSetMembers(activeList.id, next);
    } catch (err) {
      setError(formatAppError(err, 'No se pudo actualizar'));
    } finally {
      setBusy(false);
    }
  }

  async function openOrCreateLinkedExpense() {
    if (!activeList) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const expenseId = await onEnsureExpense(activeList.id);
      if (!expenseId) {
        throw new Error('No se pudo crear o vincular el gasto');
      }
      await onOpenExpense(expenseId);
    } catch (err) {
      setError(formatAppError(err, 'No se pudo abrir el gasto'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleSection
      title={neededCount > 0 ? `Listas compartidas (${neededCount} falta)` : 'Listas compartidas'}
      accent="amber"
      info={<InfoTip title="Listas compartidas" message={INFO} tone="amber" />}>
      {isLoading ? (
        <ActivityIndicator color="#d97706" />
      ) : (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            {lists.map((list) => {
              const active = activeList?.id === list.id;
              const missing = list.items.filter((item) => item.needed).length;
              return (
                <SafePressable
                  key={list.id}
                  onPress={() => setSelectedListId(list.id)}
                  contentStyle={mergeStyles(
                    interactive.chip,
                    active ? interactive.chipActive : interactive.chipInactive,
                  )}>
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                    {list.name}
                    {missing > 0 ? ` · ${missing}` : ''}
                  </Text>
                </SafePressable>
              );
            })}
          </View>

          {!addFormOpen ? (
            <SafePressable
              onPress={() => {
                setAddFormOpen(true);
                setError(null);
                if (currentUserId && newMemberIds.length === 0) {
                  setNewMemberIds([
                    currentUserId,
                    ...members.map((m) => m.user_id).filter((id) => id !== currentUserId),
                  ]);
                }
              }}
              contentStyle={mergeStyles(interactive.secondaryButton, { alignSelf: 'flex-start' })}>
              <Text className="text-sm font-semibold text-gray-800">+ Añadir lista</Text>
            </SafePressable>
          ) : (
            <View className="gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <TextField
                label="Nombre"
                value={newListName}
                onChangeText={setNewListName}
                placeholder="Súper, baño…"
              />
              <TextField
                label="Importe del gasto (€)"
                value={newListAmount}
                onChangeText={setNewListAmount}
                keyboardType="decimal-pad"
                placeholder="0 = recordatorio"
              />
              <Text className="text-xs text-gray-600">¿Con quién se comparte?</Text>
              {members.map((member) => {
                const selected = newMemberIds.includes(member.user_id);
                return (
                  <SafePressable
                    key={`new-${member.id}`}
                    onPress={() => toggleNewMember(member.user_id)}
                    contentStyle={mergeStyles(
                      interactive.borderedCard,
                      interactive.rowBetween,
                      selected ? interactive.borderedCardActive : undefined,
                    )}>
                    <Text className="text-sm text-gray-900">
                      {member.profiles?.display_name ?? 'Compañero'}
                      {member.user_id === currentUserId ? ' · tú' : ''}
                    </Text>
                    <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                  </SafePressable>
                );
              })}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="secondary" onPress={resetAddForm} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Crear lista + gasto"
                    loading={busy}
                    onPress={() => void handleAddList()}
                  />
                </View>
              </View>
            </View>
          )}

          {activeList ? (
            <View className="gap-3 rounded-xl border border-amber-100 bg-white p-3">
              <Text className="text-sm font-semibold text-gray-900">{activeList.name}</Text>

              <View className="gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                <Text className="text-xs font-semibold uppercase text-emerald-800">Gasto controlado</Text>
                {linkedExpense ? (
                  <Text className="text-sm text-emerald-950">
                    {linkedExpense.title} · {linkedExpense.amount.toFixed(2)} € · {linkedExpense.status}
                  </Text>
                ) : hasLinkedExpenseId ? (
                  <Text className="text-sm text-emerald-900/80">
                    Gasto vinculado (puede no verse en tus filtros actuales).
                  </Text>
                ) : (
                  <Text className="text-sm text-emerald-900/80">Aún no hay gasto vinculado.</Text>
                )}
                <Button
                  label={hasLinkedExpenseId ? 'Abrir gasto' : 'Crear / vincular gasto'}
                  variant="secondary"
                  loading={busy}
                  onPress={() => void openOrCreateLinkedExpense()}
                />
              </View>

              <Text className="text-xs font-semibold text-gray-700">Compartida con</Text>
              {members.map((member) => {
                const selected = activeList.member_ids.includes(member.user_id);
                return (
                  <SafePressable
                    key={`share-${member.id}`}
                    onPress={() => void toggleMemberOnActive(member.user_id)}
                    contentStyle={mergeStyles(
                      interactive.borderedCard,
                      interactive.rowBetween,
                      selected ? interactive.borderedCardActive : undefined,
                    )}>
                    <Text className="text-sm text-gray-900">
                      {member.profiles?.display_name ?? 'Compañero'}
                    </Text>
                    <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                  </SafePressable>
                );
              })}

              <SafePressable
                onPress={() => {
                  const enabled = !activeList.rotation_enabled;
                  const buyer =
                    enabled
                      ? (activeList.current_buyer_user_id ??
                        activeList.member_ids[0] ??
                        members[0]?.user_id ??
                        null)
                      : null;
                  void onSetRotation(activeList.id, enabled, buyer);
                }}
                contentStyle={mergeStyles(
                  interactive.borderedCard,
                  activeList.rotation_enabled ? interactive.borderedCardActive : undefined,
                )}>
                <Text className="text-sm font-medium text-gray-900">
                  {activeList.rotation_enabled ? '✓ ' : ''}Rotación para ir a comprar
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  {activeList.rotation_enabled
                    ? `Comprador actual: ${memberName(activeList.current_buyer_user_id)}`
                    : 'Opcional: el acreedor/comprador rota entre participantes.'}
                </Text>
              </SafePressable>

              {activeList.rotation_enabled ? (
                <View className="gap-2">
                  {members
                    .filter((member) => activeList.member_ids.includes(member.user_id))
                    .map((member) => {
                      const selected = member.user_id === activeList.current_buyer_user_id;
                      return (
                        <SafePressable
                          key={member.id}
                          onPress={() => void onSetRotation(activeList.id, true, member.user_id)}
                          contentStyle={mergeStyles(
                            interactive.borderedCard,
                            interactive.rowBetween,
                            selected ? interactive.borderedCardActive : undefined,
                          )}>
                          <Text className="text-sm text-gray-900">
                            {member.profiles?.display_name ?? 'Compañero'}
                          </Text>
                          <Text className="text-sm text-blue-700">{selected ? '✓' : ''}</Text>
                        </SafePressable>
                      );
                    })}
                </View>
              ) : null}

              {activeList.items.length === 0 ? (
                <Text className="text-sm text-gray-500">Lista vacía. Añade lo que falta.</Text>
              ) : (
                activeList.items.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <SafePressable
                      onPress={() => void onToggleNeeded(item.id, !item.needed)}
                      style={{ flex: 1 }}>
                      <Text
                        className={`text-sm ${item.needed ? 'font-semibold text-amber-900' : 'text-gray-400 line-through'}`}>
                        {item.needed ? '⚠️ ' : '✓ '}
                        {item.title}
                      </Text>
                    </SafePressable>
                    <SafePressable onPress={() => void onRemoveItem(item.id)}>
                      <Text className="text-xs font-semibold text-red-600">Quitar</Text>
                    </SafePressable>
                  </View>
                ))
              )}

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextField
                    label="Añadir elemento"
                    value={newItemTitle}
                    onChangeText={setNewItemTitle}
                    placeholder="Papel, detergente…"
                  />
                </View>
                <View className="justify-end pb-1">
                  <Button
                    label="Añadir"
                    variant="secondary"
                    loading={busy}
                    onPress={() => void handleAddItem()}
                  />
                </View>
              </View>
            </View>
          ) : (
            <Text className="text-sm text-gray-500">Crea la primera lista compartida.</Text>
          )}

          {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        </View>
      )}
    </CollapsibleSection>
  );
}
