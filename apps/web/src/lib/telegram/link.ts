import { randomUUID } from 'node:crypto';

import { getRedis } from '../redis';

const TTL_SECONDS = 600;

const key = (token: string) => `tglink:${token}`;

export async function issueLinkToken(userId: string): Promise<string> {
  const token = randomUUID();
  await getRedis().set(key(token), userId, 'EX', TTL_SECONDS);
  return token;
}

export async function consumeLinkToken(token: string): Promise<string | null> {
  const redis = getRedis();
  const userId = await redis.get(key(token));
  if (!userId) return null;
  await redis.del(key(token));
  return userId;
}
