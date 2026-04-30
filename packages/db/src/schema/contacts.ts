import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    telegram: text('telegram'),
    birthday: date('birthday'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userIdx: index('contacts_user_idx').on(t.userId) }),
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
