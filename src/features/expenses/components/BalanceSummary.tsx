import { Text, View } from 'react-native';

import { formatEuro, type ExpenseBalanceSummary } from '@/features/expenses/lib/expense-balances';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';

type BalanceSummaryProps = {
  balances: ExpenseBalanceSummary;
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
};

function memberName(members: HomeMemberWithProfile[], userId: string): string {
  const member = members.find((item) => item.user_id === userId);
  return member?.profiles?.display_name ?? 'Compañero';
}

/**
 * Compact "quién debe a quién" card for Feed (amber money; rose = you owe).
 */
export function BalanceSummary({ balances, members, currentUserId }: BalanceSummaryProps) {
  const relevantDebts = currentUserId
    ? balances.debts.filter(
        (debt) => debt.fromUserId === currentUserId || debt.toUserId === currentUserId,
      )
    : balances.debts;
  const owedToYou = balances.netForUser > 0.009;
  const youOwe = balances.netForUser < -0.009;
  const absolute = formatEuro(Math.abs(balances.netForUser));

  return (
    <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4 gap-2">
      {owedToYou ? (
        <Text className="text-xl font-bold text-amber-950">Te deben {absolute}</Text>
      ) : youOwe ? (
        <Text className="text-xl font-bold text-rose-800">Debes {absolute}</Text>
      ) : (
        <Text className="text-xl font-bold text-stone-900">Estáis a cero</Text>
      )}

      {relevantDebts.length === 0 ? (
        <View className="mt-1 gap-0.5 rounded-xl border border-dashed border-amber-200/80 bg-white/50 px-3 py-3">
          <Text className="text-sm font-semibold text-amber-950">Sin deudas abiertas</Text>
          <Text className="text-sm leading-5 text-amber-900/70">
            Cuando haya pendientes, verás quién debe a quién aquí.
          </Text>
        </View>
      ) : (
        relevantDebts.slice(0, 4).map((debt) => {
          const from = memberName(members, debt.fromUserId);
          const to = memberName(members, debt.toUserId);
          const mine = currentUserId === debt.fromUserId;
          return (
            <View
              key={`${debt.fromUserId}-${debt.toUserId}`}
              className={`rounded-lg px-2.5 py-1.5 ${
                mine ? 'bg-rose-100/80' : 'bg-amber-100/70'
              }`}>
              <Text className={`text-sm font-medium ${mine ? 'text-rose-950' : 'text-amber-950'}`}>
                {mine
                  ? `Debes ${formatEuro(debt.amount)} a ${to}`
                  : `${from} te debe ${formatEuro(debt.amount)}`}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
