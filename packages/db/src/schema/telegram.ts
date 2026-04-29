import { sql } from 'drizzle-orm';
import { bigint, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { users } from './auth.js';

export const telegramLinks = pgTable(
  'telegram_links',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull(),
    username: text('username'),
    chatId: bigint('chat_id', { mode: 'bigint' }).notNull(),
    isActive: timestamp('is_active', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    linkedAt: timestamp('linked_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    telegramIdIdx: uniqueIndex('telegram_links_telegram_id_idx').on(t.telegramId),
  }),
);

export type TelegramLink = typeof telegramLinks.$inferSelect;
export type NewTelegramLink = typeof telegramLinks.$inferInsert;
