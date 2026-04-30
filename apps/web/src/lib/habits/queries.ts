import { and, asc, between, eq, gte, isNull, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { habits, habitCheckins, type Habit, type HabitCheckin } from '@letget/db/schema';

const { db } = createDbClient();

export async function listHabits(userId: string): Promise<Habit[]> {
  return await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(asc(habits.createdAt));
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | null> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listCheckinsForRange(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<HabitCheckin[]> {
  return await db
    .select()
    .from(habitCheckins)
    .where(
      and(eq(habitCheckins.userId, userId), between(habitCheckins.performedOn, fromDate, toDate)),
    )
    .orderBy(asc(habitCheckins.performedOn));
}

export async function getTodayCheckins(userId: string): Promise<HabitCheckin[]> {
  return await db
    .select()
    .from(habitCheckins)
    .where(and(eq(habitCheckins.userId, userId), sql`${habitCheckins.performedOn} = CURRENT_DATE`));
}

/**
 * For each habit: count consecutive days with check-ins ending today (or yesterday if today missed).
 * Daily = each consecutive day. Weekly / n_per_week = consecutive ISO weeks where target met.
 */
export async function computeStreaks(userId: string): Promise<Record<string, number>> {
  const userHabits = await listHabits(userId);
  if (userHabits.length === 0) return {};

  // Pull a generous window — 90 days back covers up to ~12 weeks of streak.
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 90);

  const fromISO = toIsoDate(from);
  const toISO = toIsoDate(today);

  const rows = await db
    .select()
    .from(habitCheckins)
    .where(
      and(eq(habitCheckins.userId, userId), between(habitCheckins.performedOn, fromISO, toISO)),
    );

  // Index check-ins by habit then by date.
  const perHabit = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!perHabit.has(r.habitId)) perHabit.set(r.habitId, new Map());
    perHabit.get(r.habitId)!.set(r.performedOn as unknown as string, r.count);
  }

  const result: Record<string, number> = {};

  for (const h of userHabits) {
    const map = perHabit.get(h.id);
    if (!map || map.size === 0) {
      result[h.id] = 0;
      continue;
    }

    if (h.frequency === 'daily') {
      result[h.id] = countDailyStreak(map, h.targetCount, today);
    } else {
      result[h.id] = countWeeklyStreak(map, h.targetCount, today);
    }
  }

  return result;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function countDailyStreak(map: Map<string, number>, target: number, today: Date): number {
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  // If today not done, allow yesterday as the streak end (so the user has "today still ahead").
  const todayKey = toIsoDate(cursor);
  const todayCount = map.get(todayKey) ?? 0;
  if (todayCount < target) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i += 1) {
    const key = toIsoDate(cursor);
    const c = map.get(key) ?? 0;
    if (c >= target) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function countWeeklyStreak(map: Map<string, number>, target: number, today: Date): number {
  // For weekly habits, count consecutive ISO weeks where total count >= target.
  let streak = 0;
  const cursor = startOfWeek(today);

  // Compute current week's total. If incomplete, allow last week as the streak end.
  const thisWeekTotal = sumWeek(map, cursor);
  if (thisWeekTotal < target) {
    cursor.setDate(cursor.getDate() - 7);
  }

  for (let i = 0; i < 52; i += 1) {
    const total = sumWeek(map, cursor);
    if (total >= target) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  // ISO week: Monday = 1 .. Sunday = 7 -> shift to Monday.
  const dow = (out.getDay() + 6) % 7; // Mon=0..Sun=6
  out.setDate(out.getDate() - dow);
  return out;
}

function sumWeek(map: Map<string, number>, weekStart: Date): number {
  let total = 0;
  const cursor = new Date(weekStart);
  for (let i = 0; i < 7; i += 1) {
    total += map.get(toIsoDate(cursor)) ?? 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

// Re-export so other code can import without using deps directly.
export { gte };
