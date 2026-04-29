import { describe, it, expect, vi } from 'vitest';
import { makeValidPassword } from '@letget/lib/tests/helpers';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers([['x-forwarded-for', '127.0.0.1']])),
}));
vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(async () => ({ user: { id: 'u1', email: 'a@b.c' } })),
    },
  },
}));
vi.mock('../../src/lib/auth/login-history', () => ({
  recordLoginAttempt: vi.fn(async () => {}),
}));
vi.mock('../../src/lib/rate-limit', () => ({
  checkLimit: vi.fn(async () => ({ allowed: true, remaining: 4, resetAt: 0 })),
}));

const validInput = () => ({ email: 'a@b.co', password: makeValidPassword() });

describe('signIn action', () => {
  it('rejects rate-limited requests', async () => {
    const rl = await import('../../src/lib/rate-limit');
    (rl.checkLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: 0,
    });
    const { signIn } = await import('../../src/app/(auth)/sign-in/actions');
    const res = await signIn(validInput());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('rate_limited');
  });

  it('records success and returns ok', async () => {
    const { signIn } = await import('../../src/app/(auth)/sign-in/actions');
    const res = await signIn(validInput());
    expect(res.ok).toBe(true);
  });
});
