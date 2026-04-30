import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  date,
} from 'drizzle-orm/pg-core';

import { genId } from '../id';

import { users } from './auth';

export const habitFrequencyEnum = pgEnum('habit_frequency', ['daily', 'weekly', 'n_per_week']);

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),
    color: text('color'),
    frequency: habitFrequencyEnum('frequency').notNull().default('daily'),
    targetCount: integer('target_count').notNull().default(1),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('habits_user_idx').on(t.userId),
  }),
);

export const habitCheckins = pgTable(
  'habit_checkins',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    performedOn: date('performed_on').notNull(),
    count: integer('count').notNull().default(1),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniq: uniqueIndex('habit_checkins_habit_date_idx').on(t.habitId, t.performedOn),
    userIdx: index('habit_checkins_user_idx').on(t.userId),
  }),
);

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCheckin = typeof habitCheckins.$inferSelect;
export type NewHabitCheckin = typeof habitCheckins.$inferInsert;
