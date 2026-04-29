import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { telegramLinks, users } from '@letget/db/schema';

const { db } = createDbClient();

export type BotUser = { id: string; email: string };

export async function getUserByChatId(chatId: bigint): Promise<BotUser | null> {
  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(telegramLinks)
    .innerJoin(users, eq(users.id, telegramLinks.userId))
    .where(eq(telegramLinks.chatId, chatId))
    .limit(1);
  return rows[0] ?? null;
}
