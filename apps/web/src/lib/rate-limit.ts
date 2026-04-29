import { getRedis } from './redis';

type Opts = { key: string; max: number; windowSec: number };
type Result = { allowed: boolean; remaining: number; resetAt: number };

export async function checkLimit({ key, max, windowSec }: Opts): Promise<Result> {
  const redis = getRedis();
  const now = Date.now();
  const cutoff = now - windowSec * 1000;
  const fullKey = `rl:${key}`;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  await redis.zremrangebyscore(fullKey, 0, cutoff);
  await redis.zadd(fullKey, now, member);
  const count = await redis.zcard(fullKey);
  await redis.pexpire(fullKey, windowSec * 1000);

  if (count > max) {
    await redis.zrem(fullKey, member);
    return { allowed: false, remaining: 0, resetAt: now + windowSec * 1000 };
  }
  return { allowed: true, remaining: max - count, resetAt: now + windowSec * 1000 };
}
