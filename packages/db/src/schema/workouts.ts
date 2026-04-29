import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    icon: text('icon'),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('workout_exercises_user_idx').on(t.userId),
    userSlugIdx: uniqueIndex('workout_exercises_user_slug_idx').on(t.userId, t.slug),
  }),
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    reps: integer('reps').notNull(),
    notes: text('notes'),
    performedAt: timestamp('performed_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userPerformedIdx: index('workout_sets_user_performed_idx').on(t.userId, t.performedAt),
    exerciseIdx: index('workout_sets_exercise_idx').on(t.exerciseId),
  }),
);

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
