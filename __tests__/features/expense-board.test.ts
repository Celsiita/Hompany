import {
  formatEuro,
  splitAmountEvenly,
  summarizeExpenseBalances,
} from '@/features/expenses/lib/expense-balances';
import { applyExpenseBoardFilters, buildExpenseParticipantIds, filterExpensesByInvolvement } from '@/features/expenses/lib/expense-filters';
import { upsertExpenseInputSchema, expenseInvolvementFilterSchema } from '@/schemas/expense.schema';
import type { ExpenseWithRelations } from '@/types/database.types';
import { EXPENSE_KIND_LABEL } from '@/types/expense';

const HOME_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ANA = '11111111-1111-1111-1111-111111111111';
const BRUNO = '22222222-2222-2222-2222-222222222222';

function makeExpense(overrides: Partial<ExpenseWithRelations> = {}): ExpenseWithRelations {
  return {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    home_id: HOME_ID,
    title: 'Test',
    description: null,
    kind: 'HOUSE',
    item_type_id: null,
    amount: 10,
    currency: 'EUR',
    paid_by: ANA,
    status: 'OPEN',
    receipt_image_url: null,
    recurrence: 'ONCE',
    created_at: '2026-08-16T00:00:00.000Z',
    updated_at: '2026-08-16T00:00:00.000Z',
    base_title: 'Test',
    series_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    due_at: '2026-08-16T00:00:00.000Z',
    due_mode: 'DEADLINE',
    starts_at: null,
    all_day: false,
    completed_at: null,
    recurrence_config: {},
    auto_assign: false,
    split_mode: 'EQUAL',
    payer: { id: ANA, display_name: 'Ana', avatar_url: null },
    expense_shares: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        home_id: HOME_ID,
        expense_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        user_id: ANA,
        share_amount: 5,
        share_percent: null,
        settlement_status: 'PENDING',
        created_at: '2026-08-16T00:00:00.000Z',
        profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        home_id: HOME_ID,
        expense_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        user_id: BRUNO,
        share_amount: 5,
        share_percent: null,
        settlement_status: 'PENDING',
        created_at: '2026-08-16T00:00:00.000Z',
        profiles: { id: BRUNO, display_name: 'Bruno', avatar_url: null },
      },
    ],
    ...overrides,
  };
}

describe('splitAmountEvenly', () => {
  it('splits cents without losing remainder', () => {
    expect(splitAmountEvenly(10, 3)).toEqual([3.34, 3.33, 3.33]);
  });
});

describe('summarizeExpenseBalances', () => {
  it('nets who owes whom and ignores zero-amount reminders', () => {
    const summary = summarizeExpenseBalances(
      [
        makeExpense(),
        makeExpense({
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          amount: 0,
          expense_shares: [
            {
              id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
              home_id: HOME_ID,
              expense_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
              user_id: BRUNO,
              share_amount: 0,
        share_percent: null,
              settlement_status: 'PENDING',
              created_at: '2026-08-16T00:00:00.000Z',
              profiles: null,
            },
          ],
        }),
      ],
      ANA,
    );

    expect(summary.netForUser).toBe(5);
    expect(summary.debts).toEqual([{ fromUserId: BRUNO, toUserId: ANA, amount: 5 }]);
  });

  it('ignores already settled shares', () => {
    const summary = summarizeExpenseBalances(
      [
        makeExpense({
          expense_shares: [
            {
              id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
              home_id: HOME_ID,
              expense_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              user_id: ANA,
              share_amount: 5,
        share_percent: null,
              settlement_status: 'PENDING',
              created_at: '2026-08-16T00:00:00.000Z',
              profiles: null,
            },
            {
              id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
              home_id: HOME_ID,
              expense_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              user_id: BRUNO,
              share_amount: 5,
        share_percent: null,
              settlement_status: 'SETTLED',
              created_at: '2026-08-16T00:00:00.000Z',
              profiles: null,
            },
          ],
        }),
      ],
      ANA,
    );
    expect(summary.netForUser).toBe(0);
  });
});

describe('expense filters', () => {
  const CARLA = '33333333-3333-3333-3333-333333333333';

  it('filters by kind and status', () => {
    const expenses = [
      makeExpense({ kind: 'GROCERY', status: 'OPEN' }),
      makeExpense({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        kind: 'PEER',
        status: 'SETTLED',
      }),
    ];

    expect(
      applyExpenseBoardFilters({
        expenses,
        kind: 'ALL',
        status: 'OPEN',
        involvement: 'THEY_OWE_ME',
        userId: ANA,
      }),
    ).toHaveLength(1);
    expect(
      applyExpenseBoardFilters({
        expenses,
        kind: 'PEER',
        status: 'SETTLED',
        involvement: 'THEY_OWE_ME',
        userId: ANA,
      })[0]?.kind,
    ).toBe('PEER');
  });

  it('hides expenses the user is not involved in', () => {
    const uninvolved = makeExpense({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      paid_by: CARLA,
      expense_shares: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9',
          home_id: HOME_ID,
          expense_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          user_id: CARLA,
          share_amount: 10,
        share_percent: null,
          settlement_status: 'PENDING',
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: null,
        },
      ],
    });
    const mine = makeExpense();

    expect(filterExpensesByInvolvement([mine, uninvolved], 'I_OWE', ANA)).toEqual([]);
    expect(filterExpensesByInvolvement([mine, uninvolved], 'THEY_OWE_ME', ANA)).toHaveLength(1);
    expect(
      filterExpensesByInvolvement([mine, uninvolved], 'THEY_OWE_ME', ANA).map((item) => item.id),
    ).not.toContain(uninvolved.id);
    expect(filterExpensesByInvolvement([mine], 'I_OWE', BRUNO)).toHaveLength(1);
    expect(filterExpensesByInvolvement([mine, uninvolved], 'ALL', ANA)).toHaveLength(1);
    expect(filterExpensesByInvolvement([mine, uninvolved], 'ALL', ANA)[0]?.id).toBe(mine.id);
  });

  it('builds participant ids from debtors', () => {
    expect(
      buildExpenseParticipantIds({
        paidBy: ANA,
        debtorIds: [BRUNO],
        includePayerInSplit: false,
      }),
    ).toEqual([BRUNO]);
    expect(
      buildExpenseParticipantIds({
        paidBy: ANA,
        debtorIds: [BRUNO],
        includePayerInSplit: true,
      }),
    ).toEqual([ANA, BRUNO]);
  });
});

describe('upsertExpenseInputSchema', () => {
  it('requires home_id, amount and at least one debtor', () => {
    const parsed = upsertExpenseInputSchema.parse({
      home_id: HOME_ID,
      title: 'Agua',
      kind: 'HOUSE',
      amount: 42,
      paid_by: ANA,
      debtor_ids: [BRUNO],
      include_payer_in_split: true,
      due_at: '2026-08-20T22:00:00.000Z',
    });
    expect(parsed.title).toBe('Agua');
    expect(parsed.due_at).toBe('2026-08-20T22:00:00.000Z');
    expect(() =>
      upsertExpenseInputSchema.parse({
        home_id: HOME_ID,
        title: 'Agua',
        kind: 'HOUSE',
        amount: 42,
        paid_by: ANA,
        debtor_ids: [],
        due_at: '2026-08-20T22:00:00.000Z',
      }),
    ).toThrow();
    expect(() =>
      upsertExpenseInputSchema.parse({
        home_id: HOME_ID,
        title: 'Agua',
        kind: 'HOUSE',
        amount: 42,
        paid_by: ANA,
        debtor_ids: [BRUNO],
        include_payer_in_split: true,
      }),
    ).toThrow();
  });
});

describe('expense kind labels', () => {
  it('shows PEER expenses as Ocio', () => {
    expect(EXPENSE_KIND_LABEL.PEER).toBe('Ocio');
  });
});

describe('expense involvement schema', () => {
  it('treats ALL as show every expense the user is in', () => {
    expect(expenseInvolvementFilterSchema.parse('ALL')).toBe('ALL');
    expect(expenseInvolvementFilterSchema.parse('I_OWE')).toBe('I_OWE');
  });
});

describe('formatEuro', () => {
  it('formats spanish euros', () => {
    expect(formatEuro(14)).toBe('14,00 €');
  });
});
