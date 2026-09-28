import { ZodError } from 'zod';

/**
 * Turns unknown thrown values into a user-visible message (Supabase, Zod, Error, etc.).
 */
export function formatAppError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    if (first) {
      return first.message;
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    const message = (err as { message: string }).message.trim();
    if (message.length > 0) {
      return message;
    }
  }
  return fallback;
}
