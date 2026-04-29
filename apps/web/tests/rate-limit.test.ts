import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { checkLimit } from '../src/lib/rate-limit';
import { getRedis } from '../src/lib/redis';

const redis = getRedis();

afterEach(async () => {
  await redis.flushdb();
});

afterAll(async () => {
  await redis.quit();
});

describe('checkLimit', () => {
  it('allows up to max within window, blocks after', async () => {
    const opts = { key: 'test:rl:1', max: 3, windowSec: 60 };
    expect((await checkLimit(opts)).allowed).toBe(true);
    expect((await checkLimit(opts)).allowed).toBe(true);
    expect((await checkLimit(opts)).allowed).toBe(true);
    const over = await checkLimit(opts);
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });
});
