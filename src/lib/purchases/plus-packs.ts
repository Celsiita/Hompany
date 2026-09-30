import { isBuiltinIconPackId, type IconPackId } from '@/lib/icons/packs';

/**
 * Icon packs are free. Plus monetizes reputation insights (see Feed).
 * Kept for API compatibility with IconPackProvider.
 */
export function iconPackRequiresPlus(_packId: IconPackId): boolean {
  void _packId;
  void isBuiltinIconPackId;
  return false;
}
