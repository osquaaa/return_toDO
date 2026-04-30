import { and, eq, sql } from 'drizzle-orm';

import { createDbClient, genId } from '@letget/db';
import { habits, habitCheckins, type Habit } from '@letget/db/schema';
import type { CheckinInput, CreateHabitInput, UpdateHabitInput } from '@letget/lib/zod/habits';

const { db } = createDbClient();

async function ensureOwnership(userId: string, habitId: string): Promise<boolean> {
  const rows = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function createHabit(userId: string, input: CreateHabitInput): Promise<Habit> {
  const [row] = await db
    .insert(habits)
    .values({
      id: genId(),
      userId,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      frequency: input.frequency,
      targetCount: input.targetCount,
    })
    .returning();
  return row;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: UpdateHabitInput,
): Promise<Habit | null> {
  const owns = await ensureOwnership(userId, habitId);
  if (!owns) return null;

  const patch: Partial<typeof habits.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;
  if (input.frequency !== undefined) patch.frequency = input.frequency;
  if (input.targetCount !== undefined) patch.targetCount = input.targetCount;

  const rows = await db
    .update(habits)
    .set(patch)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function archiveHabit(userId: string, habitId: string): Promise<boolean> {
  const rows = await db
    .update(habits)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning({ id: habits.id });
  return rows.length > 0;
}

export async function addCheckin(userId: string, input: CheckinInput): Promise<boolean> {
  const owns = await ensureOwnership(userId, input.habitId);
  if (!owns) return false;

  // UPSERT: if (habitId, performedOn) exists, increment count by input.count, else insert.
  await db
    .insert(habitCheckins)
    .values({
      id: genId(),
      userId,
      habitId: input.habitId,
      performedOn: input.performedOn,
      count: input.count,
      notes: input.notes ?? null,
    })
    .onConflictDoUpdate({
      target: [habitCheckins.habitId, habitCheckins.performedOn],
      set: {
        count: sql`${habitCheckins.count} + ${input.count}`,
        notes: input.notes ?? sql`${habitCheckins.notes}`,
      },
    });
  return true;
}

export async function removeCheckin(
  userId: string,
  habitId: string,
  performedOn: string,
): Promise<boolean> {
  const owns = await ensureOwnership(userId, habitId);
  if (!owns) return false;
  const rows = await db
    .delete(habitCheckins)
    .where(
      and(
        eq(habitCheckins.userId, userId),
        eq(habitCheckins.habitId, habitId),
        eq(habitCheckins.performedOn, performedOn),
      ),
    )
    .returning({ id: habitCheckins.id });
  return rows.length > 0;
}

export async function decrementCheckin(
  userId: string,
  habitId: string,
  performedOn: string,
): Promise<boolean> {
  const owns = await ensureOwnership(userId, habitId);
  if (!owns) return false;

  const existing = await db
    .select()
    .from(habitCheckins)
    .where(
      and(
        eq(habitCheckins.userId, userId),
        eq(habitCheckins.habitId, habitId),
        eq(habitCheckins.performedOn, performedOn),
      ),
    )
    .limit(1);

  const row = existing[0];
  if (!row) return false;

  if (row.count <= 1) {
    await db.delete(habitCheckins).where(eq(habitCheckins.id, row.id));
    return true;
  }

  await db
    .update(habitCheckins)
    .set({ count: row.count - 1 })
    .where(eq(habitCheckins.id, row.id));
  return true;
}
