import type { ExpenseWithRelations } from '@/types/database.types';
import { isShareSettled } from '@/features/expenses/lib/expense-settlement';
import { formatMoney } from '@/lib/i18n/format-price';

export type PairwiseDebt = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type ExpenseBalanceSummary = {
  /** Positive: others owe the user. Negative: the user owes others. */
  netForUser: number;
  debts: PairwiseDebt[];
};

/**
 * Splits `amount` evenly across participants, cents-safe (last share gets remainder).
 */
export function splitAmountEvenly(amount: number, participantCount: number): number[] {
  if (participantCount <= 0) {
    return [];
  }
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / participantCount);
  const remainder = cents - base * participantCount;
  return Array.from({ length: participantCount }, (_, index) => {
    const extra = index < remainder ? 1 : 0;
    return (base + extra) / 100;
  });
}

/**
 * Converts percentages (must sum ~100) into euro amounts that sum to `amount`.
 */
export function splitAmountByPercents(amount: number, percents: number[]): number[] {
  if (percents.length === 0) {
    return [];
  }
  const cents = Math.round(amount * 100);
  const raw = percents.map((percent) => Math.floor((cents * percent) / 100));
  let used = raw.reduce((sum, value) => sum + value, 0);
  let index = 0;
  while (used < cents && index < raw.length) {
    raw[index] += 1;
    used += 1;
    index += 1;
  }
  return raw.map((value) => value / 100);
}

/**
 * Validates percent shares sum to 100 (±0.01).
 */
export function percentsSumToHundred(percents: number[]): boolean {
  const sum = percents.reduce((total, value) => total + value, 0);
  return Math.abs(sum - 100) < 0.05;
}

/**
 * Validates fixed amounts sum to the expense total (±1 cent).
 */
export function amountsSumToTotal(amounts: number[], total: number): boolean {
  const sum = amounts.reduce((acc, value) => acc + Math.round(value * 100), 0);
  return Math.abs(sum - Math.round(total * 100)) <= 1;
}

/**
 * Formats a money amount for the active app locale (EUR in ES, USD in EN).
 * Kept as `formatEuro` for call-site compatibility.
 */
export function formatEuro(amount: number): string {
  return formatMoney(amount);
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds simplified pairwise debts from open expenses (amount > 0).
 * Each debtor owes their share to the person who paid, then nets cancel out.
 */
export function summarizeExpenseBalances(
  expenses: ExpenseWithRelations[],
  userId: string | null | undefined,
): ExpenseBalanceSummary {
  const netByUser = new Map<string, number>();

  function add(user: string, delta: number) {
    netByUser.set(user, roundCents((netByUser.get(user) ?? 0) + delta));
  }

  for (const expense of expenses) {
    if (expense.status !== 'OPEN' || expense.amount <= 0) {
      continue;
    }
    for (const share of expense.expense_shares) {
      if (
        share.user_id === expense.paid_by ||
        share.share_amount <= 0 ||
        isShareSettled(share)
      ) {
        continue;
      }
      add(share.user_id, -share.share_amount);
      add(expense.paid_by, share.share_amount);
    }
  }

  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [id, net] of netByUser) {
    if (net < -0.009) {
      debtors.push({ userId: id, amount: roundCents(-net) });
    } else if (net > 0.009) {
      creditors.push({ userId: id, amount: roundCents(net) });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: PairwiseDebt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const take = Math.min(debtors[i].amount, creditors[j].amount);
    debts.push({
      fromUserId: debtors[i].userId,
      toUserId: creditors[j].userId,
      amount: roundCents(take),
    });
    debtors[i].amount = roundCents(debtors[i].amount - take);
    creditors[j].amount = roundCents(creditors[j].amount - take);
    if (debtors[i].amount <= 0.009) {
      i += 1;
    }
    if (creditors[j].amount <= 0.009) {
      j += 1;
    }
  }

  const netForUser = userId ? roundCents(netByUser.get(userId) ?? 0) : 0;

  return { netForUser, debts };
}
