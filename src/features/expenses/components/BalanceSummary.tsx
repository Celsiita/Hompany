import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatEuro, type ExpenseBalanceSummary } from '@/features/expenses/lib/expense-balances';
import type { HomeMemberWithProfile } from '@/features/home/api/homes-api';
import { useLocale } from '@/providers/LocaleProvider';

type BalanceSummaryProps = {
  balances: ExpenseBalanceSummary;
  members: HomeMemberWithProfile[];
  currentUserId?: string | null;
};

function memberName(
  members: HomeMemberWithProfile[],
  userId: string,
  fallback: string,
): string {
  const member = members.find((item) => item.user_id === userId);
  return member?.profiles?.display_name ?? fallback;
}

const CARD_SHADOW = {
  shadowColor: '#1c1917',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/**
 * Compact "quién debe a quién" card for Feed (amber money; rose = you owe).
 */
export function BalanceSummary({ balances, members, currentUserId }: BalanceSummaryProps) {
  const { t } = useLocale();
  const roommate = t('common.roommate');
  const relevantDebts = currentUserId
    ? balances.debts.filter(
        (debt) => debt.fromUserId === currentUserId || debt.toUserId === currentUserId,
      )
    : balances.debts;
  const owedToYou = balances.netForUser > 0.009;
  const youOwe = balances.netForUser < -0.009;
  const absolute = formatEuro(Math.abs(balances.netForUser));

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(320).springify().damping(18)}
      className="gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5"
      style={CARD_SHADOW}>
      {owedToYou ? (
        <View className="gap-0.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
            {t('chip.theyOwe')}
          </Text>
          <Text className="text-3xl font-black tracking-tight text-amber-950">{absolute}</Text>
        </View>
      ) : youOwe ? (
        <View className="gap-0.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-rose-800/80">
            {t('chip.youOwe')}
          </Text>
          <Text className="text-3xl font-black tracking-tight text-rose-900">{absolute}</Text>
        </View>
      ) : (
        <View className="gap-0.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            {t('home.cuentas')}
          </Text>
          <Text className="text-3xl font-black tracking-tight text-stone-900">{t('money.zero')}</Text>
        </View>
      )}

      {relevantDebts.length === 0 ? (
        <View className="gap-0.5 rounded-2xl border border-dashed border-amber-200/80 bg-white/60 px-3 py-3">
          <Text className="text-sm font-semibold text-amber-950">{t('money.noDebts')}</Text>
          <Text className="text-sm leading-5 text-amber-900/70">{t('money.noDebts.sub')}</Text>
        </View>
      ) : (
        <View className="gap-2">
          {relevantDebts.slice(0, 4).map((debt) => {
            const from = memberName(members, debt.fromUserId, roommate);
            const to = memberName(members, debt.toUserId, roommate);
            const mine = currentUserId === debt.fromUserId;
            const amount = formatEuro(debt.amount);
            return (
              <View
                key={`${debt.fromUserId}-${debt.toUserId}`}
                className={`rounded-xl px-3 py-2.5 ${
                  mine ? 'bg-rose-100/90' : 'bg-white/80'
                }`}>
                <Text
                  className={`text-sm font-semibold ${mine ? 'text-rose-950' : 'text-amber-950'}`}>
                  {mine
                    ? t('money.youOweTo', { amount, name: to })
                    : t('money.theyOweYou', { amount, name: from })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}
