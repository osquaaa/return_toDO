import { and, eq, gte, isNull } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import {
  workoutExercises,
  workoutSets,
  type WorkoutExercise,
  type WorkoutSet,
} from '@letget/db/schema';
import type { AddExerciseInput, AddSetInput } from '@letget/lib/zod/workouts';

const { db } = createDbClient();

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'exercise';
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function addExercise(
  userId: string,
  input: AddExerciseInput,
): Promise<WorkoutExercise> {
  const baseSlug = slugify(input.name);
  const trySlugs = [baseSlug, `${baseSlug}-${Date.now()}`];
  let lastErr: unknown = null;
  for (const slug of trySlugs) {
    try {
      const [row] = await db
        .insert(workoutExercises)
        .values({
          id: genId(),
          userId,
          name: input.name.trim(),
          slug,
          icon: input.icon ?? null,
        })
        .returning();
      return row;
    } catch (err) {
      lastErr = err;
      // Unique constraint? Try next slug.
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
    }
  }
  throw lastErr ?? new Error('Failed to insert exercise');
}

export async function archiveExercise(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(workoutExercises)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(workoutExercises.id, id),
        eq(workoutExercises.userId, userId),
        isNull(workoutExercises.archivedAt),
      ),
    )
    .returning({ id: workoutExercises.id });
  return rows.length > 0;
}

async function assertExerciseOwned(
  userId: string,
  exerciseId: string,
): Promise<WorkoutExercise | null> {
  const rows = await db
    .select()
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.id, exerciseId),
        eq(workoutExercises.userId, userId),
        isNull(workoutExercises.archivedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function addSet(userId: string, input: AddSetInput): Promise<WorkoutSet | null> {
  const owned = await assertExerciseOwned(userId, input.exerciseId);
  if (!owned) return null;
  const [row] = await db
    .insert(workoutSets)
    .values({
      id: genId(),
      userId,
      exerciseId: input.exerciseId,
      reps: input.reps,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function removeSet(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
    .returning({ id: workoutSets.id });
  return rows.length > 0;
}

export async function clearTodaySets(userId: string, exerciseId?: string): Promise<number> {
  const start = startOfTodayLocal();
  const conds = [eq(workoutSets.userId, userId), gte(workoutSets.performedAt, start)];
  if (exerciseId) conds.push(eq(workoutSets.exerciseId, exerciseId));
  const rows = await db
    .delete(workoutSets)
    .where(and(...conds))
    .returning({ id: workoutSets.id });
  return rows.length;
}
