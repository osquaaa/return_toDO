import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

describe('getCurrentUser', () => {
  it('returns null when no session', async () => {
    const { getCurrentUser } = await import('../../src/lib/auth/session');
    const u = await getCurrentUser();
    expect(u).toBeNull();
  });

  it('returns user when session present', async () => {
    const mod = await import('../../src/lib/auth/auth');
    (mod.auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: 'u1', email: 'a@b.c', role: 'user' },
      session: { id: 's1' },
    });
    const { getCurrentUser } = await import('../../src/lib/auth/session');
    const u = await getCurrentUser();
    expect(u?.id).toBe('u1');
  });
});
