import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CUSTOM_ICON_PACKS_STORAGE_KEY,
  ICON_PACKS,
  ICON_PACK_STORAGE_KEY,
  isBuiltinIconPackId,
  parseImportedIconPackJson,
  type IconPack,
  type IconPackId,
} from '@/lib/icons/packs';
import { iconPackRequiresPlus } from '@/lib/purchases/plus-packs';
import { usePurchases } from '@/providers/PurchasesProvider';

type IconPackContextValue = {
  packId: IconPackId;
  pack: IconPack;
  packs: IconPack[];
  /**
   * Selects a pack. Locked Plus packs open the paywall instead of switching.
   * @returns true when the pack became active.
   */
  setPackId: (id: IconPackId) => Promise<boolean>;
  /**
   * Imports a custom pack (Plus). Opens paywall when the user is not Plus.
   */
  importPackFromJson: (raw: string) => Promise<IconPack | null>;
  removeCustomPack: (id: IconPackId) => Promise<void>;
  /** Whether the pack needs HOMPANY Plus and the user does not have it. */
  isPackLocked: (id: IconPackId) => boolean;
};

const IconPackContext = createContext<IconPackContextValue | null>(null);

function resolvePack(packId: IconPackId, custom: IconPack[]): IconPack {
  if (isBuiltinIconPackId(packId)) {
    return ICON_PACKS[packId];
  }
  return custom.find((item) => item.id === packId) ?? ICON_PACKS.classic;
}

/**
 * Persists the selected thematic icon pack and any imported custom packs.
 * Non-Classic packs require HOMPANY Plus (`hompany_plus` entitlement).
 */
export function IconPackProvider({ children }: PropsWithChildren) {
  const { isPlus, presentPaywall } = usePurchases();
  const [packId, setPackIdState] = useState<IconPackId>('classic');
  const [customPacks, setCustomPacks] = useState<IconPack[]>([]);

  useEffect(() => {
    void (async () => {
      const [storedId, storedCustoms] = await Promise.all([
        AsyncStorage.getItem(ICON_PACK_STORAGE_KEY),
        AsyncStorage.getItem(CUSTOM_ICON_PACKS_STORAGE_KEY),
      ]);

      let customs: IconPack[] = [];
      if (storedCustoms) {
        try {
          const parsed = JSON.parse(storedCustoms) as IconPack[];
          if (Array.isArray(parsed)) {
            customs = parsed.filter(
              (item) =>
                typeof item?.id === 'string' &&
                item.id.startsWith('custom:') &&
                typeof item.name === 'string',
            );
            setCustomPacks(customs);
          }
        } catch {
          setCustomPacks([]);
        }
      }

      if (storedId && (isBuiltinIconPackId(storedId) || customs.some((p) => p.id === storedId))) {
        setPackIdState(storedId as IconPackId);
      }
    })();
  }, []);

  useEffect(() => {
    if (isPlus) {
      return;
    }
    if (iconPackRequiresPlus(packId)) {
      setPackIdState('classic');
      void AsyncStorage.setItem(ICON_PACK_STORAGE_KEY, 'classic');
    }
  }, [isPlus, packId]);

  const isPackLocked = useCallback(
    (id: IconPackId) => iconPackRequiresPlus(id) && !isPlus,
    [isPlus],
  );

  const applyPackId = useCallback(async (id: IconPackId) => {
    setPackIdState(id);
    await AsyncStorage.setItem(ICON_PACK_STORAGE_KEY, id);
  }, []);

  const setPackId = useCallback(
    async (id: IconPackId) => {
      if (iconPackRequiresPlus(id) && !isPlus) {
        const unlocked = await presentPaywall();
        if (!unlocked) {
          return false;
        }
      }
      await applyPackId(id);
      return true;
    },
    [isPlus, presentPaywall, applyPackId],
  );

  const importPackFromJson = useCallback(
    async (raw: string) => {
      const pack = parseImportedIconPackJson(raw);
      const next = [...customPacks.filter((item) => item.name !== pack.name), pack];
      setCustomPacks(next);
      await AsyncStorage.setItem(CUSTOM_ICON_PACKS_STORAGE_KEY, JSON.stringify(next));
      await applyPackId(pack.id);
      return pack;
    },
    [customPacks, applyPackId],
  );

  const removeCustomPack = useCallback(
    async (id: IconPackId) => {
      const next = customPacks.filter((item) => item.id !== id);
      setCustomPacks(next);
      await AsyncStorage.setItem(CUSTOM_ICON_PACKS_STORAGE_KEY, JSON.stringify(next));
      if (packId === id) {
        await applyPackId('classic');
      }
    },
    [customPacks, packId, applyPackId],
  );

  const packs = useMemo(
    () => [...Object.values(ICON_PACKS), ...customPacks],
    [customPacks],
  );

  const value = useMemo<IconPackContextValue>(
    () => ({
      packId,
      pack: resolvePack(packId, customPacks),
      packs,
      setPackId,
      importPackFromJson,
      removeCustomPack,
      isPackLocked,
    }),
    [packId, customPacks, packs, setPackId, importPackFromJson, removeCustomPack, isPackLocked],
  );

  return <IconPackContext.Provider value={value}>{children}</IconPackContext.Provider>;
}

/**
 * Active emoji pack. Must be used within IconPackProvider.
 */
export function useIconPack(): IconPackContextValue {
  const context = useContext(IconPackContext);
  if (!context) {
    throw new Error('useIconPack must be used within IconPackProvider');
  }
  return context;
}
