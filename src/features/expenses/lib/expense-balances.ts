import type { ExpenseWithRelations } from '@/types/database.types';
import { isShareSettled } from '@/features/expenses/lib/expense-settlement';

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
 * Formats a euro amount with Spanish-style decimals.
 */
export function formatEuro(amount: number): string {
  const absolute = Math.abs(amount);
  const [integerPart, decimalPart] = absolute.toFixed(2).split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped},${decimalPart} €`;
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
