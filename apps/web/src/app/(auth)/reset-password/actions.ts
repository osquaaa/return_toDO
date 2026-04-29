'use server';

import { z } from 'zod';

import { passwordResetSchema } from '@letget/lib/zod/auth';

import { auth } from '@/lib/auth/auth';

const formSchema = z
  .object({
    token: z.string().min(1),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

type Result = { ok: true } | { ok: false; error: string };

export async function performReset(input: unknown): Promise<Result> {
  const form = formSchema.safeParse(input);
  if (!form.success) return { ok: false, error: form.error.issues[0].message };

  const parsed = passwordResetSchema.safeParse({
    token: form.data.token,
    newPassword: form.data.password,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.newPassword },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Ссылка некорректна или истекла',
    };
  }
}
