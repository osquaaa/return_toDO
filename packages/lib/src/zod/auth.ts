import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Минимум 8 символов')
  .max(128, 'Максимум 128 символов')
  .regex(/[a-z]/, 'Хотя бы одна строчная буква')
  .regex(/[A-Z]/, 'Хотя бы одна заглавная буква')
  .regex(/[0-9]/, 'Хотя бы одна цифра');

export const signUpSchema = z.object({
  email: z.string().email('Некорректный email').max(255),
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email().max(255),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
