 
import { describe, it, expect, vi } from 'vitest';

vi.mock('@letget/db/client', () => ({
  createDbClient: () => ({
    db: {
      insert: () => ({
        values: () => Promise.resolve(),
      }),
    },
  }),
}));

vi.mock('ioredis', () => {
  const Redis = vi.fn(() => ({
    get: vi.fn((k: string) => Promise.resolve(k === 'tglink:good-token' ? 'user-1' : null)),
    del: vi.fn(() => Promise.resolve(1)),
    quit: vi.fn(() => Promise.resolve()),
  }));
  return { default: Redis };
});

describe('linkAccountFromToken', () => {
  it('returns linked when token valid', async () => {
    const { linkAccountFromToken } = await import('../src/services/link-account');
    const r = await linkAccountFromToken({
      token: 'good-token',
      telegramId: 42n,
      chatId: 42n,
      username: 'me',
    });
    expect(r.kind).toBe('linked');
  });

  it('returns expired when token unknown', async () => {
    const { linkAccountFromToken } = await import('../src/services/link-account');
    const r = await linkAccountFromToken({
      token: 'bad-token',
      telegramId: 42n,
      chatId: 42n,
      username: 'me',
    });
    expect(r.kind).toBe('expired');
  });
});
