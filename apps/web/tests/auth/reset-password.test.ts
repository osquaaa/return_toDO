import { describe, it, expect, vi } from 'vitest';
import { makeShortPassword, makeValidPassword } from '@letget/lib/tests/helpers';

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      requestPasswordReset: vi.fn(async () => ({ status: true })),
      resetPassword: vi.fn(async () => ({ status: true })),
    },
  },
}));

describe('reset password actions', () => {
  it('forget always returns ok (anti-enumeration)', async () => {
    const { requestReset } = await import('../../src/app/(auth)/forgot-password/actions');
    const res = await requestReset({ email: 'unknown@x.y' });
    expect(res.ok).toBe(true);
  });

  it('reset rejects too-short password', async () => {
    const tooShort = makeShortPassword();
    const { performReset } = await import('../../src/app/(auth)/reset-password/actions');
    const res = await performReset({ token: 'tok', password: tooShort, confirmPassword: tooShort });
    expect(res.ok).toBe(false);
  });

  it('reset rejects mismatched confirm', async () => {
    const valid = makeValidPassword();
    const { performReset } = await import('../../src/app/(auth)/reset-password/actions');
    const res = await performReset({ token: 'tok', password: valid, confirmPassword: valid + 'x' });
    expect(res.ok).toBe(false);
  });

  it('reset accepts valid input', async () => {
    const valid = makeValidPassword();
    const { performReset } = await import('../../src/app/(auth)/reset-password/actions');
    const res = await performReset({ token: 'tok', password: valid, confirmPassword: valid });
    expect(res.ok).toBe(true);
  });
});
