import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { Button } from '@/components/ui/Button';
import { HelpTip } from '@/components/ui/HelpTip';
import { SafePressable } from '@/components/ui/SafePressable';
import { mergeStyles } from '@/lib/interactive-styles';
import { usePurchases } from '@/providers/PurchasesProvider';

type PreviewTileProps = {
  glyph: string;
  title: string;
  subtitle: string;
};

/**
 * Static preview tile for the matching roadmap (not interactive search).
 */
function PreviewTile({ glyph, title, subtitle }: PreviewTileProps) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-2xl border border-teal-100 bg-white px-3 py-3">
      <Text className="text-xl">{glyph}</Text>
      <Text className="text-sm font-bold text-stone-900">{title}</Text>
      <Text className="text-[11px] leading-4 text-stone-500">{subtitle}</Text>
    </View>
  );
}

/**
 * Shipaton teaser: shows matching vision without a fake working flow.
 */
export function MatchingPreviewCard() {
  const [open, setOpen] = useState(false);
  const { isPlus, presentPaywall } = usePurchases();

  return (
    <>
      <View className="overflow-hidden rounded-3xl border border-teal-200 bg-teal-50/80">
        <SafePressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver idea de emparejar piso y gente"
          contentStyle={mergeStyles({
            paddingHorizontal: 14,
            paddingVertical: 14,
            gap: 12,
          })}>
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-base font-bold text-teal-950">Emparejar piso ↔ gente</Text>
                <View className="rounded-full bg-amber-100 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase text-amber-900">Próximamente</Text>
                </View>
              </View>
              <Text className="text-xs leading-4 text-teal-900/80">
                Buscar piso o compañeros con reputación como señal de confianza. Plus.
              </Text>
            </View>
            <HelpTip
              title="Matching"
              message="Idea de producto: perfiles opt-in, listados Plus y solicitud para unirse. El piso que ya tienes sigue gratis."
            />
          </View>

          <View className="flex-row gap-2">
            <PreviewTile
              glyph="🏠"
              title="Buscar piso"
              subtitle="Zona, plazas, reglas y salud del hogar"
            />
            <PreviewTile
              glyph="👋"
              title="Buscar gente"
              subtitle="Uni, presupuesto, hábitos y reputación"
            />
          </View>

          <Text className="text-center text-xs font-semibold text-teal-800">Ver la idea ›</Text>
        </SafePressable>
      </View>

      <BottomSheetModal visible={open} onClose={() => setOpen(false)} maxHeightClassName="max-h-[85%]">
        <View className="gap-4">
          <View className="gap-1">
            <Text className="text-lg font-bold text-stone-900">Cómo encajaría</Text>
            <Text className="text-sm leading-5 text-stone-600">
              Tras el login podrías elegir: tengo piso, busco piso o mi piso busca gente. Perfiles
              públicos con opt-in. Match → solicitud → aceptar → entrar al hogar. Sin chat complejo
              al inicio.
            </Text>
          </View>

          <View className="gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
            <Text className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Qué verías
            </Text>
            <Text className="text-sm text-stone-800">1. Perfil corto (ciudad, uni, hábitos)</Text>
            <Text className="text-sm text-stone-800">2. Listados Plus con filtros simples</Text>
            <Text className="text-sm text-stone-800">3. Solicitud → aceptar → ya estás en el piso</Text>
          </View>

          <View className="gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3">
            <Text className="text-xs font-bold uppercase tracking-wide text-teal-800">Plus</Text>
            <Text className="text-sm text-teal-950">
              Core gratis = tu piso. Plus = descubrir y contactar. La reputación del Feed será la
              señal de confianza.
            </Text>
          </View>

          {!isPlus ? (
            <Button
              label="Ver HOMPANY Plus"
              onPress={() => {
                setOpen(false);
                void presentPaywall();
              }}
            />
          ) : (
            <View className="rounded-xl bg-teal-700 px-3 py-3">
              <Text className="text-center text-sm font-semibold text-white">
                Plus activo · matching en camino
              </Text>
            </View>
          )}

          <Button label="Entendido" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </BottomSheetModal>
    </>
  );
}
