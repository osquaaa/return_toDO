import Redis from 'ioredis';

import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';

import { env } from '../env';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  lazyConnect: false,
  maxRetriesPerRequest: 2,
});
const { db } = createDbClient();

type Args = { token: string; telegramId: bigint; chatId: bigint; username: string | null };
type Result = { kind: 'linked'; userId: string } | { kind: 'expired' } | { kind: 'conflict' };

export async function linkAccountFromToken(args: Args): Promise<Result> {
  const userId = await redis.get(`tglink:${args.token}`);
  if (!userId) return { kind: 'expired' };

  try {
    await db.insert(telegramLinks).values({
      userId,
      telegramId: args.telegramId,
      chatId: args.chatId,
      username: args.username,
      linkedAt: new Date(),
    });
    await redis.del(`tglink:${args.token}`);
    return { kind: 'linked', userId };
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { kind: 'conflict' };
    }
    throw err;
  }
}
