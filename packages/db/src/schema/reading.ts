import { sql } from 'drizzle-orm';
import { date, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const bookStatusEnum = pgEnum('book_status', ['want', 'reading', 'done', 'paused']);

export const books = pgTable(
  'books',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    author: text('author'),
    status: bookStatusEnum('status').notNull().default('want'),
    pagesTotal: integer('pages_total'),
    pagesRead: integer('pages_read').notNull().default(0),
    rating: integer('rating'),
    startedOn: date('started_on'),
    finishedOn: date('finished_on'),
    notes: text('notes'),
    coverUrl: text('cover_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userStatusIdx: index('books_user_status_idx').on(t.userId, t.status),
  }),
);

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
