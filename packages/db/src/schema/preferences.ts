import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').notNull().default('light'),
  language: text('language').notNull().default('ru'),
  timezone: text('timezone').notNull().default('Europe/Moscow'),
  defaultView: text('default_view').notNull().default('tasks'),
  migratedV1At: timestamp('migrated_v1_at', { withTimezone: true, mode: 'date' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
