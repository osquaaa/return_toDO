import { describe, it, expect } from 'vitest';

import { signUpSchema, signInSchema, passwordResetSchema } from '../src/zod/auth.js';
import { makeNoUpper, makeShort, makeValid } from './helpers.js';

describe('auth zod schemas', () => {
  it('signUpSchema accepts valid email + strong password', () => {
    const input = { email: 'user@example.com', name: 'Иван', password: makeValid() };
    expect(signUpSchema.safeParse(input).success).toBe(true);
  });

  it('signUpSchema rejects short password', () => {
    const input = { email: 'user@example.com', password: makeShort() };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects password without uppercase', () => {
    const input = { email: 'user@example.com', password: makeNoUpper() };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects invalid email', () => {
    const input = { email: 'not-email', password: makeValid() };
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
