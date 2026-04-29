import { and, asc, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import {
  workoutExercises,
  workoutSets,
  type WorkoutExercise,
  type WorkoutSet,
} from '@letget/db/schema';

const { db } = createDbClient();

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listExercises(userId: string): Promise<WorkoutExercise[]> {
  return await db
    .select()
    .from(workoutExercises)
    .where(and(eq(workoutExercises.userId, userId), isNull(workoutExercises.archivedAt)))
    .orderBy(asc(workoutExercises.createdAt));
}

export async function getExercise(userId: string, id: string): Promise<WorkoutExercise | null> {
  const rows = await db
    .select()
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.id, id),
        eq(workoutExercises.userId, userId),
        isNull(workoutExercises.archivedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listSetsForToday(userId: string, exerciseId?: string): Promise<WorkoutSet[]> {
  const start = startOfTodayLocal();
  const conds = [eq(workoutSets.userId, userId), gte(workoutSets.performedAt, start)];
  if (exerciseId) conds.push(eq(workoutSets.exerciseId, exerciseId));
  return await db
    .select()
    .from(workoutSets)
    .where(and(...conds))
    .orderBy(desc(workoutSets.performedAt));
}

export async function listSetsForRange(
  userId: string,
  fromDate: Date,
  toDate: Date,
): Promise<WorkoutSet[]> {
  return await db
    .select()
    .from(workoutSets)
    .where(
      and(
        eq(workoutSets.userId, userId),
        gte(workoutSets.performedAt, fromDate),
        lte(workoutSets.performedAt, toDate),
      ),
    )
    .orderBy(asc(workoutSets.performedAt));
}

export type WorkoutSummary = {
  totalAllTime: number;
  total7d: number;
  byExercise: { exerciseId: string; name: string; total: number }[];
};

export async function summary(userId: string): Promise<WorkoutSummary> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [allTimeRow] = await db
    .select({ total: sql<number>`coalesce(sum(${workoutSets.reps}), 0)::int` })
    .from(workoutSets)
    .where(eq(workoutSets.userId, userId));

  const [last7Row] = await db
    .select({ total: sql<number>`coalesce(sum(${workoutSets.reps}), 0)::int` })
    .from(workoutSets)
    .where(and(eq(workoutSets.userId, userId), gte(workoutSets.performedAt, sevenDaysAgo)));

  const byExerciseRows = await db
    .select({
      exerciseId: workoutExercises.id,
      name: workoutExercises.name,
      total: sql<number>`coalesce(sum(${workoutSets.reps}), 0)::int`,
    })
    .from(workoutExercises)
    .leftJoin(workoutSets, eq(workoutSets.exerciseId, workoutExercises.id))
    .where(and(eq(workoutExercises.userId, userId), isNull(workoutExercises.archivedAt)))
    .groupBy(workoutExercises.id, workoutExercises.name)
    .orderBy(asc(workoutExercises.createdAt));

  return {
    totalAllTime: allTimeRow?.total ?? 0,
    total7d: last7Row?.total ?? 0,
    byExercise: byExerciseRows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name,
      total: r.total,
    })),
  };
}
