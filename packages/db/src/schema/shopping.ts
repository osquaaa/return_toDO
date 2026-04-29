import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const shoppingTrips = pgTable(
  'shopping_trips',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Поход'),
    isCurrent: boolean('is_current').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('shopping_trips_user_idx').on(t.userId),
    userCurrentIdx: uniqueIndex('shopping_trips_user_current_idx')
      .on(t.userId)
      .where(sql`is_current = true`),
  }),
);

export const shoppingItems = pgTable(
  'shopping_items',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => shoppingTrips.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: text('quantity'),
    isDone: boolean('is_done').notNull().default(false),
    position: integer('position').notNull(),
    doneAt: timestamp('done_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tripPositionIdx: index('shopping_items_trip_position_idx').on(t.tripId, t.position),
  }),
);

export type ShoppingTrip = typeof shoppingTrips.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
