import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/providers/LocaleProvider';
import { usePurchases } from '@/providers/PurchasesProvider';

type PreviewTileProps = {
  glyph: string;
  title: string;
  subtitle: string;
};

type MatchingPreviewSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type MatchingSoonButtonProps = {
  /** Full-width row under Feed ranking; compact pill in headers. */
  layout?: 'compact' | 'row';
};

/**
 * Static preview tile for the matching roadmap.
 */
function PreviewTile({ glyph, title, subtitle }: PreviewTileProps) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-2xl border border-amber-100 bg-white px-3 py-3">
      <Text className="text-xl">{glyph}</Text>
      <Text className="text-sm font-bold text-stone-900">{title}</Text>
      <Text className="text-[11px] leading-4 text-stone-500">{subtitle}</Text>
    </View>
  );
}

/**
 * Matching vision sheet (Shipaton teaser — no fake search flow).
 */
export function MatchingPreviewSheet({ visible, onClose }: MatchingPreviewSheetProps) {
  const { t } = useLocale();
  const { isPlus, presentPaywall } = usePurchases();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightClassName="max-h-[85%]">
      <View className="gap-4">
        <View className="gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-lg font-bold text-stone-900">{t('matching.title')}</Text>
            <View className="rounded-full bg-amber-100 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase text-amber-900">
                {t('piso.soon')}
              </Text>
            </View>
          </View>
          <Text className="text-sm leading-5 text-stone-600">{t('matching.body')}</Text>
        </View>

        <View className="flex-row gap-2">
          <PreviewTile
            glyph="🏠"
            title={t('matching.findFlat')}
            subtitle={t('matching.findFlat.sub')}
          />
          <PreviewTile
            glyph="👋"
            title={t('matching.findPeople')}
            subtitle={t('matching.findPeople.sub')}
          />
        </View>

        <View className="gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
          <Text className="text-xs font-bold uppercase tracking-wide text-stone-500">
            {t('matching.preview')}
          </Text>
          <Text className="text-sm text-stone-800">{t('matching.step1')}</Text>
          <Text className="text-sm text-stone-800">{t('matching.step2')}</Text>
          <Text className="text-sm text-stone-800">{t('matching.step3')}</Text>
        </View>

        {!isPlus ? (
          <Button
            label={t('settings.plus.see')}
            onPress={() => {
              onClose();
              void presentPaywall();
            }}
          />
        ) : (
          <View className="rounded-xl bg-amber-600 px-3 py-3">
            <Text className="text-center text-sm font-semibold text-white">
              {t('matching.plusActive')}
            </Text>
          </View>
        )}

        <Button label={t('common.understood')} variant="secondary" onPress={onClose} />
      </View>
    </BottomSheetModal>
  );
}

/**
 * Amber “Próximamente” control that opens the matching vision sheet.
 */
export function MatchingSoonButton({ layout = 'compact' }: MatchingSoonButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      {layout === 'row' ? (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('matching.a11y')}
          className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <View className="rounded-full bg-amber-200/80 px-2.5 py-1">
            <Text className="text-[10px] font-bold uppercase text-amber-950">{t('piso.soon')}</Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-sm font-bold text-amber-950">{t('matching.rowTitle')}</Text>
            <Text className="text-[11px] leading-4 text-amber-900/80">{t('matching.rowSub')}</Text>
          </View>
          <Text className="text-base font-bold text-amber-800">›</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('matching.a11y')}
          className="h-11 flex-row items-center rounded-xl border border-amber-300 bg-amber-50 px-3">
          <Text className="text-xs font-bold text-amber-950">{t('piso.soon')}</Text>
        </Pressable>
      )}
      <MatchingPreviewSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** @deprecated Use MatchingSoonButton */
export const MatchingHeaderButton = MatchingSoonButton;
