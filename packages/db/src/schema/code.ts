import { sql } from 'drizzle-orm';
import { boolean, customType, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const codeSnippets = pgTable(
  'code_snippets',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    code: text('code').notNull(),
    language: text('language'),
    isPinned: boolean('is_pinned').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(code, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('code_snippets_user_idx').on(t.userId),
    searchIdx: index('code_snippets_search_idx').using('gin', t.searchVector),
  }),
);

export type CodeSnippet = typeof codeSnippets.$inferSelect;
