import { sql } from 'drizzle-orm';
import { date, index, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const financeKindEnum = pgEnum('finance_kind', ['income', 'expense']);

export const financeCategories = pgTable(
  'finance_categories',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: financeKindEnum('kind').notNull(),
    color: text('color'),
    icon: text('icon'),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userIdx: index('finance_categories_user_idx').on(t.userId) }),
);

export const financeTransactions = pgTable(
  'finance_transactions',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => financeCategories.id, {
      onDelete: 'set null',
    }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('RUB'),
    description: text('description'),
    occurredOn: date('occurred_on').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userOccurredIdx: index('finance_tx_user_occurred_idx').on(t.userId, t.occurredOn),
    categoryIdx: index('finance_tx_category_idx').on(t.categoryId),
  }),
);

export type FinanceCategory = typeof financeCategories.$inferSelect;
export type NewFinanceCategory = typeof financeCategories.$inferInsert;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type NewFinanceTransaction = typeof financeTransactions.$inferInsert;
