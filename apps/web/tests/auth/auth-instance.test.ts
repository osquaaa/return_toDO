import { describe, it, expect } from 'vitest';
import { auth } from '../../src/lib/auth/auth';

describe('auth instance', () => {
  it('exposes a Next.js handler', () => {
    expect(auth.handler).toBeTypeOf('function');
  });
  it('exposes the api object with sign-up endpoint', () => {
    expect(auth.api.signUpEmail).toBeTypeOf('function');
  });
});
