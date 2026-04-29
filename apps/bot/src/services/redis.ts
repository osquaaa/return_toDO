import Redis from 'ioredis';

import { env } from '../env';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  lazyConnect: false,
  maxRetriesPerRequest: 2,
});

export const TODAY_LIST_TTL_S = 60 * 60;

export function todayListKey(userId: string): string {
  return `tg:today:${userId}`;
}
