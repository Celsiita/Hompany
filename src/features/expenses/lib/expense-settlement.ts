import { z } from 'zod';

export const expenseShareSettlementStatusSchema = z.enum([
  'PENDING',
  'REQUESTED',
  'SETTLED',
]);

export type ExpenseShareSettlementStatus = z.infer<
  typeof expenseShareSettlementStatusSchema
>;

export const EXPENSE_SHARE_SETTLEMENT_STATUS = {
  PENDING: 'PENDING',
  REQUESTED: 'REQUESTED',
  SETTLED: 'SETTLED',
} as const satisfies Record<ExpenseShareSettlementStatus, ExpenseShareSettlementStatus>;

export const EXPENSE_SHARE_SETTLEMENT_LABEL: Record<ExpenseShareSettlementStatus, string> = {
  PENDING: 'Pendiente',
  REQUESTED: 'Solicitado',
  SETTLED: 'Saldado',
};

type ShareLike = {
  settlement_status?: ExpenseShareSettlementStatus | null;
  /** @deprecated migrated to settlement_status */
  is_settled?: boolean;
};

/**
 * True when the share no longer counts toward open debt.
 */
export function isShareSettled(share: ShareLike): boolean {
  if (share.settlement_status) {
    return share.settlement_status === 'SETTLED';
  }
  return Boolean(share.is_settled);
}

/**
 * True when the debtor has asked the creditor to confirm payment.
 */
export function isShareSettlementRequested(share: ShareLike): boolean {
  return share.settlement_status === 'REQUESTED';
}
