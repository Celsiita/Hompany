import { isBuiltinIconPackId, type IconPackId } from '@/lib/icons/packs';

/**
 * Free tier keeps the Classic pack only. Hogar, Play and custom packs need Plus.
 */
export function iconPackRequiresPlus(packId: IconPackId): boolean {
  if (!isBuiltinIconPackId(packId)) {
    return true;
  }
  return packId !== 'classic';
}
