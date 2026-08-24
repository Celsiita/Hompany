import { z } from 'zod';

/**
 * Zod schema for creating a new home.
 */
export const createHomeInputSchema = z.object({
  name: z.string().min(1, 'Nombre del piso requerido').max(60),
});

/**
 * Zod schema for joining a home by invite code.
 */
export const joinHomeInputSchema = z.object({
  inviteCode: z
    .string()
    .min(4, 'Código demasiado corto')
    .max(16)
    .transform((value) => value.trim().toUpperCase()),
});

export type CreateHomeInput = z.infer<typeof createHomeInputSchema>;
export type JoinHomeInput = z.infer<typeof joinHomeInputSchema>;
