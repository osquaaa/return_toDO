import { describe, it, expect, vi } from 'vitest';

describe('sign-up hooks', () => {
  it('promotes user to admin when email matches ADMIN_EMAIL', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@letget.test');
    vi.resetModules();
    const { resolveRoleForEmail } = await import('../../src/lib/auth/role-policy');
    expect(resolveRoleForEmail('admin@letget.test')).toBe('admin');
    expect(resolveRoleForEmail('user@letget.test')).toBe('user');
  });

  it('returns user when ADMIN_EMAIL unset', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    vi.resetModules();
    const { resolveRoleForEmail } = await import('../../src/lib/auth/role-policy');
    expect(resolveRoleForEmail('admin@letget.test')).toBe('user');
  });
});
