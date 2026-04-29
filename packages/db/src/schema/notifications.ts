import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const eventTypeEnum = pgEnum('event_type', [
  'morning_digest',
  'task_deadline',
  'workout_streak_warn',
  'weekly_recap',
  'custom_reminder',
]);

export const channelEnum = pgEnum('notification_channel', ['telegram']);

export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    channel: channelEnum('channel').notNull().default('telegram'),
    timeOfDay: time('time_of_day'),
    minutesBefore: integer('minutes_before'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('notification_prefs_user_idx').on(t.userId),
    userEventIdx: uniqueIndex('notification_prefs_user_event_idx').on(t.userId, t.eventType),
  }),
);

export const notificationsQueue = pgTable(
  'notifications_queue',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true, mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('notifications_queue_user_idx').on(t.userId),
    pickupIdx: index('notifications_queue_pickup_idx')
      .on(t.scheduledFor)
      .where(sql`sent_at IS NULL`),
  }),
);

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type NotificationQueueItem = typeof notificationsQueue.$inferSelect;
export type NewNotificationQueueItem = typeof notificationsQueue.$inferInsert;
