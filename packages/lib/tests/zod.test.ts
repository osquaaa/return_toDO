import { describe, it, expect } from 'vitest';

import { signUpSchema, signInSchema, passwordResetSchema } from '../src/zod/auth.js';
import { makeNoUpper, makeShort, makeValid } from './helpers.js';

describe('auth zod schemas', () => {
  it('signUpSchema accepts valid email + strong password', () => {
    const pwd = makeValid();
    const input = { email: 'user@example.com', name: 'Иван', password: pwd, confirmPassword: pwd };
    expect(signUpSchema.safeParse(input).success).toBe(true);
  });

  it('signUpSchema rejects short password', () => {
    const pwd = makeShort();
    const input = { email: 'user@example.com', name: 'Иван', password: pwd, confirmPassword: pwd };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects password without uppercase', () => {
    const pwd = makeNoUpper();
    const input = { email: 'user@example.com', name: 'Иван', password: pwd, confirmPassword: pwd };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects invalid email', () => {
    const pwd = makeValid();
    const input = { email: 'not-email', name: 'Иван', password: pwd, confirmPassword: pwd };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects mismatched confirmPassword', () => {
    const pwd = makeValid();
    const input = {
      email: 'user@example.com',
      name: 'Иван',
      password: pwd,
      confirmPassword: pwd + 'x',
    };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signInSchema requires email and password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });

  it('passwordResetSchema validates new password strength', () => {
    expect(passwordResetSchema.safeParse({ token: 'abc', newPassword: makeValid() }).success).toBe(
      true,
    );
    expect(passwordResetSchema.safeParse({ token: 'abc', newPassword: makeShort() }).success).toBe(
      false,
    );
  });
});
