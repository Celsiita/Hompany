import { cycleInstanceTitle, computeInitialDueAt, computeNextOccurrence, parseRecurrenceConfig, stripCycleSuffix } from '@/lib/recurrence';
import { requireHomeId } from '@/lib/home/require-home-id';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  upsertExpenseInputSchema,
  type UpsertExpenseInput,
} from '@/schemas/expense.schema';
import type { Expense, ExpenseWithRelations } from '@/types/database.types';
import { splitAmountEvenly } from '@/features/expenses/lib/expense-balances';
import { isShareSettled } from '@/features/expenses/lib/expense-settlement';
import { buildExpenseParticipantIds } from '@/features/expenses/lib/expense-filters';

const EXPENSE_SELECT = `
  *,
  payer:profiles!expenses_paid_by_fkey (
    id,
    display_name,
    avatar_url
  ),
  expense_shares (
    id,
    home_id,
    expense_id,
    user_id,
    share_amount,
    settlement_status,
    created_at,
    profiles (
      id,
      display_name,
      avatar_url
    )
  )
`;

function coerceExpense(row: ExpenseWithRelations): ExpenseWithRelations {
  return {
    ...row,
    amount: Number(row.amount),
    expense_shares: row.expense_shares.map((share) => ({
      ...share,
      share_amount: Number(share.share_amount),
    })),
  };
}

function buildParticipantIds(input: UpsertExpenseInput): string[] {
  return buildExpenseParticipantIds({
    paidBy: input.paid_by,
    debtorIds: input.debtor_ids,
    includePayerInSplit: input.include_payer_in_split,
  });
}

/**
 * Lists expenses for a home with payer and shares. Always filters by home_id.
 */
export async function listExpensesByHome(homeId: string): Promise<ExpenseWithRelations[]> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('home_id', scopedHomeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ExpenseWithRelations[]).map(coerceExpense);
}

async function syncShares(params: {
  homeId: string;
  expenseId: string;
  participantIds: string[];
  amount: number;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('expense_shares')
    .delete()
    .eq('expense_id', params.expenseId)
    .eq('home_id', params.homeId);

  if (deleteError) {
    throw deleteError;
  }

  const splits = splitAmountEvenly(params.amount, params.participantIds.length);
  const { error: insertError } = await supabase.from('expense_shares').insert(
    params.participantIds.map((userId, index) => ({
      home_id: params.homeId,
      expense_id: params.expenseId,
      user_id: userId,
      share_amount: splits[index] ?? 0,
      settlement_status: 'PENDING',
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

/**
 * Creates an expense and equal shares for the selected participants.
 */
export async function createExpense(input: UpsertExpenseInput): Promise<ExpenseWithRelations> {
  const parsed = upsertExpenseInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const participantIds = buildParticipantIds(parsed);

  const config = parsed.recurrence_config ?? {};
  const dueAt =
    parsed.due_at ??
    (parsed.recurrence === 'ONCE'
      ? null
      : computeInitialDueAt(
          parsed.recurrence,
          config,
          new Date(),
          parsed.due_mode,
        ).toISOString());
  const baseTitle = stripCycleSuffix(parsed.title);
  const title = cycleInstanceTitle(
    baseTitle,
    parsed.recurrence,
    new Date(dueAt ?? new Date().toISOString()),
  );

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      home_id: scopedHomeId,
      title,
      base_title: baseTitle,
      description: parsed.description ?? null,
      kind: parsed.kind,
      amount: parsed.amount,
      paid_by: parsed.paid_by,
      status: 'OPEN',
      receipt_image_url: parsed.receipt_image_url ?? null,
      recurrence: parsed.recurrence,
      recurrence_config: config,
      due_at: dueAt,
      due_mode: parsed.due_mode,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  await syncShares({
    homeId: scopedHomeId,
    expenseId: data.id,
    participantIds,
    amount: parsed.amount,
  });

  const expenses = await listExpensesByHome(scopedHomeId);
  const created = expenses.find((item) => item.id === data.id);
  if (!created) {
    throw new Error('Expense created but not found');
  }
  return created;
}

/**
 * Updates an expense and rebuilds its shares.
 */
export async function updateExpense(
  expenseId: string,
  input: UpsertExpenseInput,
): Promise<ExpenseWithRelations> {
  const parsed = upsertExpenseInputSchema.parse(input);
  const scopedHomeId = requireHomeId(parsed.home_id);
  const supabase = getSupabaseClient();
  const participantIds = buildParticipantIds(parsed);

  const config = parsed.recurrence_config ?? {};
  const dueAt = parsed.due_at;
  const baseTitle = stripCycleSuffix(parsed.title);
  const title = cycleInstanceTitle(
    baseTitle,
    parsed.recurrence,
    new Date(dueAt ?? new Date().toISOString()),
  );

  const { error } = await supabase
    .from('expenses')
    .update({
      title,
      base_title: baseTitle,
      description: parsed.description ?? null,
      kind: parsed.kind,
      amount: parsed.amount,
      paid_by: parsed.paid_by,
      receipt_image_url: parsed.receipt_image_url ?? null,
      recurrence: parsed.recurrence,
      recurrence_config: config,
      due_at: dueAt,
      due_mode: parsed.due_mode,
    })
    .eq('id', expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncShares({
    homeId: scopedHomeId,
    expenseId,
    participantIds,
    amount: parsed.amount,
  });

  const expenses = await listExpensesByHome(scopedHomeId);
  const updated = expenses.find((item) => item.id === expenseId);
  if (!updated) {
    throw new Error('Expense updated but not found');
  }
  return updated;
}

/**
 * Deletes an expense scoped by home_id.
 */
export async function deleteExpense(homeId: string, expenseId: string): Promise<void> {
  const scopedHomeId = requireHomeId(homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Stores the public receipt URL on an expense without touching shares.
 */
export async function patchExpenseReceipt(params: {
  homeId: string;
  expenseId: string;
  receiptImageUrl: string | null;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expenses')
    .update({ receipt_image_url: params.receiptImageUrl })
    .eq('id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

async function spawnNextRecurringExpense(expense: ExpenseWithRelations): Promise<void> {
  const config = parseRecurrenceConfig(expense.recurrence_config);
  if (expense.recurrence === 'ONCE') {
    return;
  }

  const nextDue = computeNextOccurrence({
    lastDueAt: expense.due_at ?? expense.created_at,
    recurrence: expense.recurrence,
    config,
    dueMode: expense.due_mode ?? 'DEADLINE',
  });
  if (!nextDue) {
    return;
  }

  const expenses = await listExpensesByHome(expense.home_id);
  const hasOpen = expenses.some(
    (item) =>
      item.series_id === expense.series_id &&
      item.status === 'OPEN' &&
      item.id !== expense.id,
  );
  if (hasOpen) {
    return;
  }

  const debtorIds = expense.expense_shares
    .map((share) => share.user_id)
    .filter((userId) => userId !== expense.paid_by);
  const includePayer = expense.expense_shares.some((share) => share.user_id === expense.paid_by);
  const baseTitle = stripCycleSuffix(expense.base_title ?? expense.title);

  const created = await createExpense({
    home_id: expense.home_id,
    title: baseTitle,
    description: expense.description ?? undefined,
    kind: expense.kind,
    amount: expense.amount,
    paid_by: expense.paid_by,
    debtor_ids: debtorIds.length > 0 ? debtorIds : [expense.paid_by],
    include_payer_in_split: includePayer,
    receipt_image_url: null,
    recurrence: expense.recurrence,
    recurrence_config: config,
    due_at: nextDue.toISOString(),
    due_mode: expense.due_mode ?? 'DEADLINE',
  });

  const supabase = getSupabaseClient();
  await supabase
    .from('expenses')
    .update({ series_id: expense.series_id ?? expense.id })
    .eq('id', created.id)
    .eq('home_id', expense.home_id);
}

/**
 * Marks an expense as settled or reopens it. Monthly expenses spawn the next copy.
 */
export async function setExpenseStatus(params: {
  homeId: string;
  expenseId: string;
  status: Expense['status'];
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const supabase = getSupabaseClient();

  const current = (await listExpensesByHome(scopedHomeId)).find(
    (item) => item.id === params.expenseId,
  );

  const { error } = await supabase
    .from('expenses')
    .update({
      status: params.status,
      completed_at:
        params.status === 'SETTLED' || params.status === 'ARCHIVED'
          ? new Date().toISOString()
          : null,
    })
    .eq('id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  if (params.status === 'SETTLED' && current) {
    await spawnNextRecurringExpense(current);
  }
}

/**
 * Syncs parent expense OPEN/SETTLED from debtor share settlement statuses.
 */
async function syncExpenseStatusFromShares(homeId: string, expenseId: string): Promise<void> {
  const expenses = await listExpensesByHome(homeId);
  const expense = expenses.find((item) => item.id === expenseId);
  if (!expense) {
    return;
  }

  const remaining = expense.expense_shares.filter(
    (share) =>
      share.user_id !== expense.paid_by && !isShareSettled(share) && share.share_amount > 0,
  );

  if (remaining.length === 0 && expense.status === 'OPEN' && expense.amount > 0) {
    await setExpenseStatus({
      homeId,
      expenseId,
      status: 'SETTLED',
    });
  } else if (remaining.length > 0 && expense.status === 'SETTLED') {
    await setExpenseStatus({
      homeId,
      expenseId,
      status: 'OPEN',
    });
  }
}

async function loadShareContext(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
}) {
  const expenses = await listExpensesByHome(params.homeId);
  const expense = expenses.find((item) => item.id === params.expenseId);
  if (!expense) {
    throw new Error('Gasto no encontrado');
  }
  const share = expense.expense_shares.find((item) => item.id === params.shareId);
  if (!share) {
    throw new Error('Participación no encontrada');
  }
  return { expense, share };
}

/**
 * Debtor asks the creditor to confirm that this share is paid.
 */
export async function requestExpenseShareSettlement(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const { expense, share } = await loadShareContext({
    homeId: scopedHomeId,
    expenseId: params.expenseId,
    shareId: params.shareId,
  });

  if (expense.status !== 'OPEN') {
    throw new Error('Este gasto ya no está abierto');
  }
  if (share.user_id === expense.paid_by) {
    throw new Error('El pagador no tiene deuda que solicitar');
  }
  if (share.user_id !== params.actorId) {
    throw new Error('Solo el deudor puede solicitar la liquidación');
  }
  if (isShareSettled(share)) {
    throw new Error('Esta deuda ya está saldada');
  }
  if (share.settlement_status === 'REQUESTED') {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expense_shares')
    .update({ settlement_status: 'REQUESTED' })
    .eq('id', params.shareId)
    .eq('expense_id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Creditor marks a share as settled (from PENDING or REQUESTED).
 * Debtor requests do not change creditor UI; notification comes later.
 */
export async function confirmExpenseShareSettlement(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const { expense, share } = await loadShareContext({
    homeId: scopedHomeId,
    expenseId: params.expenseId,
    shareId: params.shareId,
  });

  if (expense.paid_by !== params.actorId) {
    throw new Error('Solo el acreedor puede marcar la deuda como saldada');
  }
  if (share.user_id === expense.paid_by) {
    throw new Error('No hay deuda que saldar');
  }
  if (isShareSettled(share)) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expense_shares')
    .update({ settlement_status: 'SETTLED' })
    .eq('id', params.shareId)
    .eq('expense_id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncExpenseStatusFromShares(scopedHomeId, params.expenseId);
}

/**
 * Creditor rejects a settlement request → back to PENDING.
 */
export async function rejectExpenseShareSettlement(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const { expense, share } = await loadShareContext({
    homeId: scopedHomeId,
    expenseId: params.expenseId,
    shareId: params.shareId,
  });

  if (expense.paid_by !== params.actorId) {
    throw new Error('Solo el acreedor puede rechazar la solicitud');
  }
  if (share.settlement_status !== 'REQUESTED') {
    throw new Error('No hay solicitud pendiente');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expense_shares')
    .update({ settlement_status: 'PENDING' })
    .eq('id', params.shareId)
    .eq('expense_id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }
}

/**
 * Creditor reopens a settled share → PENDING.
 */
export async function undoExpenseShareSettlement(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const { expense, share } = await loadShareContext({
    homeId: scopedHomeId,
    expenseId: params.expenseId,
    shareId: params.shareId,
  });

  if (expense.paid_by !== params.actorId) {
    throw new Error('Solo el acreedor puede deshacer el saldo');
  }
  if (!isShareSettled(share)) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expense_shares')
    .update({ settlement_status: 'PENDING' })
    .eq('id', params.shareId)
    .eq('expense_id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncExpenseStatusFromShares(scopedHomeId, params.expenseId);
}

/**
 * Creditor settles or reopens a single roommate share (classic Me deben flow).
 */
export async function setExpenseShareSettled(params: {
  homeId: string;
  expenseId: string;
  shareId: string;
  isSettled: boolean;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const { expense, share } = await loadShareContext({
    homeId: scopedHomeId,
    expenseId: params.expenseId,
    shareId: params.shareId,
  });

  if (expense.paid_by !== params.actorId) {
    throw new Error('Solo el acreedor puede saldar o deshacer la deuda');
  }
  if (share.user_id === expense.paid_by) {
    throw new Error('No hay deuda que modificar');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('expense_shares')
    .update({ settlement_status: params.isSettled ? 'SETTLED' : 'PENDING' })
    .eq('id', params.shareId)
    .eq('expense_id', params.expenseId)
    .eq('home_id', scopedHomeId);

  if (error) {
    throw error;
  }

  await syncExpenseStatusFromShares(scopedHomeId, params.expenseId);
}

/**
 * Creditor settles every open debtor share on an expense (Saldar todo).
 */
export async function settleAllExpenseShares(params: {
  homeId: string;
  expenseId: string;
  actorId: string;
}): Promise<void> {
  const scopedHomeId = requireHomeId(params.homeId);
  const expenses = await listExpensesByHome(scopedHomeId);
  const expense = expenses.find((item) => item.id === params.expenseId);
  if (!expense) {
    throw new Error('Gasto no encontrado');
  }
  if (expense.paid_by !== params.actorId) {
    throw new Error('Solo el acreedor puede saldar el gasto');
  }

  const openShares = expense.expense_shares.filter(
    (share) =>
      share.user_id !== expense.paid_by && !isShareSettled(share) && share.share_amount > 0,
  );

  const supabase = getSupabaseClient();
  for (const share of openShares) {
    const { error } = await supabase
      .from('expense_shares')
      .update({ settlement_status: 'SETTLED' })
      .eq('id', share.id)
      .eq('expense_id', params.expenseId)
      .eq('home_id', scopedHomeId);
    if (error) {
      throw error;
    }
  }

  await syncExpenseStatusFromShares(scopedHomeId, params.expenseId);
}
