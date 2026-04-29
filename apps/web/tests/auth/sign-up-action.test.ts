import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(async ({ body }: { body: { email: string } }) => ({
        user: { id: 'u1', email: body.email },
      })),
    },
  },
}));

describe('signUp action', () => {
  it('returns ok:false on invalid input', async () => {
    const { signUp } = await import('../../src/app/(auth)/sign-up/actions');
    const res = await signUp({
      name: '',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(res.ok).toBe(false);
  });

  it('passes valid input to Better Auth', async () => {
    const { makeValidPassword } = await import('@letget/lib/tests/helpers');
    const { signUp } = await import('../../src/app/(auth)/sign-up/actions');
    const pwd = makeValidPassword();
    const res = await signUp({
      name: 'Иван',
      email: 'a@b.co',
      password: pwd,
      confirmPassword: pwd,
    });
    expect(res.ok).toBe(true);
  });
});
