'use server';

import { signUpSchema } from '@letget/lib/zod/auth';
import { auth } from '@/lib/auth/auth';

type Result = { ok: true } | { ok: false; error: string; field?: string };

export async function signUp(input: unknown): Promise<Result> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (!issue) return { ok: false, error: 'Некорректные данные' };
    return { ok: false, error: issue.message, field: String(issue.path[0]) };
  }
  try {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name ?? '',
      },
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Не удалось зарегистрироваться';
    return { ok: false, error: msg };
  }
}
