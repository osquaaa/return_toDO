import { sql } from 'drizzle-orm';
import { boolean, customType, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentHtml: text('content_html').notNull(),
    contentText: text('content_text').notNull(),
    isDone: boolean('is_done').notNull().default(false),
    isPinned: boolean('is_pinned').notNull().default(false),
    deadline: timestamp('deadline', { withTimezone: true, mode: 'date' }),
    doneAt: timestamp('done_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('russian', coalesce(content_text, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('tasks_user_idx').on(t.userId),
    userStatusIdx: index('tasks_user_status_idx').on(t.userId, t.isDone, t.isPinned),
    deadlineIdx: index('tasks_deadline_idx').on(t.deadline),
    searchIdx: index('tasks_search_idx').using('gin', t.searchVector),
  }),
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
