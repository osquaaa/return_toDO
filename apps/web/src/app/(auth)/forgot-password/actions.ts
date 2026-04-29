'use server';

import { z } from 'zod';

import { auth } from '@/lib/auth/auth';

const requestSchema = z.object({ email: z.string().email() });

export async function requestReset(input: unknown): Promise<{ ok: true }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: true };
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: '/reset-password' },
    });
  } catch {
    /* swallow — anti-enumeration */
  }
  return { ok: true };
}
