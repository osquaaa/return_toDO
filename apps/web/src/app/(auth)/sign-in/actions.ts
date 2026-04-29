'use server';

import { headers } from 'next/headers';

import { signInSchema } from '@letget/lib/zod/auth';

import { auth } from '@/lib/auth/auth';
import { recordLoginAttempt } from '@/lib/auth/login-history';
import { checkLimit } from '@/lib/rate-limit';

type Result = { ok: true } | { ok: false; error: string; code?: string };

export async function signIn(input: unknown): Promise<Result> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
  const ua = hdrs.get('user-agent') ?? null;

  const limit = await checkLimit({ key: `signin:${ip ?? 'noip'}`, max: 5, windowSec: 900 });
  if (!limit.allowed) {
    await recordLoginAttempt({
      email: parsed.data.email,
      success: false,
      failureReason: 'rate_limited',
      ipAddress: ip,
      userAgent: ua,
    });
    return {
      ok: false,
      error: 'Слишком много попыток. Попробуй через 15 минут.',
      code: 'rate_limited',
    };
  }

  try {
    const result = await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: hdrs,
    });
    await recordLoginAttempt({
      email: parsed.data.email,
      success: true,
      userId: result.user.id,
      ipAddress: ip,
      userAgent: ua,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Не удалось войти';
    const reason = msg.toLowerCase().includes('verif') ? 'email_not_verified' : 'wrong_password';
    await recordLoginAttempt({
      email: parsed.data.email,
      success: false,
      failureReason: reason,
      ipAddress: ip,
      userAgent: ua,
    });
    return { ok: false, error: msg, code: reason };
  }
}
