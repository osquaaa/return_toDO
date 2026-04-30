import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const timeActivities = pgTable(
  'time_activities',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userIdx: index('time_activities_user_idx').on(t.userId) }),
);

export const timeSessions = pgTable(
  'time_sessions',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => timeActivities.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userStartedIdx: index('time_sessions_user_started_idx').on(t.userId, t.startedAt) }),
);

export type TimeActivity = typeof timeActivities.$inferSelect;
export type NewTimeActivity = typeof timeActivities.$inferInsert;
export type TimeSession = typeof timeSessions.$inferSelect;
export type NewTimeSession = typeof timeSessions.$inferInsert;
