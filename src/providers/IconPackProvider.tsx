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

type IconPackContextValue = {
  packId: IconPackId;
  pack: IconPack;
  packs: IconPack[];
  setPackId: (id: IconPackId) => Promise<void>;
  importPackFromJson: (raw: string) => Promise<IconPack>;
  removeCustomPack: (id: IconPackId) => Promise<void>;
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
 */
export function IconPackProvider({ children }: PropsWithChildren) {
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

  const setPackId = useCallback(async (id: IconPackId) => {
    setPackIdState(id);
    await AsyncStorage.setItem(ICON_PACK_STORAGE_KEY, id);
  }, []);

  const importPackFromJson = useCallback(
    async (raw: string) => {
      const pack = parseImportedIconPackJson(raw);
      const next = [...customPacks.filter((item) => item.name !== pack.name), pack];
      setCustomPacks(next);
      await AsyncStorage.setItem(CUSTOM_ICON_PACKS_STORAGE_KEY, JSON.stringify(next));
      await setPackId(pack.id);
      return pack;
    },
    [customPacks, setPackId],
  );

  const removeCustomPack = useCallback(
    async (id: IconPackId) => {
      const next = customPacks.filter((item) => item.id !== id);
      setCustomPacks(next);
      await AsyncStorage.setItem(CUSTOM_ICON_PACKS_STORAGE_KEY, JSON.stringify(next));
      if (packId === id) {
        await setPackId('classic');
      }
    },
    [customPacks, packId, setPackId],
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
    }),
    [packId, customPacks, packs, setPackId, importPackFromJson, removeCustomPack],
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
