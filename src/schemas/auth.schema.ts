import { z } from 'zod';

/**
 * Zod schema for login form payloads.
 */
export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

/**
 * Zod schema for registration form payloads.
 */
export const registerSchema = z.object({
  displayName: z.string().min(1, 'Nombre requerido').max(40),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
