import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }),
    allDay: boolean('all_day').notNull().default(false),
    location: text('location'),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userStartIdx: index('calendar_events_user_start_idx').on(t.userId, t.startsAt) }),
);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
