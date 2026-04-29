import { describe, it, expect, afterEach, afterAll } from 'vitest';

import { issueLinkToken, consumeLinkToken } from '../../src/lib/telegram/link';
import { getRedis } from '../../src/lib/redis';

const redis = getRedis();

afterEach(async () => {
  await redis.flushdb();
});

afterAll(async () => {
  await redis.quit();
});

describe('telegram link tokens', () => {
  it('issue → consume returns userId, then token is gone', async () => {
    const userId = '00000000-0000-7000-8000-000000000abc';
    const token = await issueLinkToken(userId);
    expect(token).toMatch(/^[a-f0-9-]{36}$/);
    const first = await consumeLinkToken(token);
    expect(first).toBe(userId);
    const second = await consumeLinkToken(token);
    expect(second).toBeNull();
  });

  it('returns null for unknown token', async () => {
    expect(await consumeLinkToken('non-existent-token')).toBeNull();
  });
});
