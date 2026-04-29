import { describe, it, expect } from 'vitest';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, workoutExercises, workoutSets } from '@letget/db/schema';
import {
  listExercises,
  getExercise,
  listSetsForToday,
  listSetsForRange,
  summary,
} from '../../src/lib/workouts/queries';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `wq-${id}@test.local`, role: 'user' });
  return id;
}

async function seedExercise(
  userId: string,
  name = 'Подтягивания',
  slug = `pullups-${genId()}`,
  archivedAt: Date | null = null,
): Promise<string> {
  const id = genId();
  await db.insert(workoutExercises).values({ id, userId, name, slug, archivedAt });
  return id;
}

async function seedSet(
  userId: string,
  exerciseId: string,
  reps: number,
  performedAt: Date,
): Promise<string> {
  const id = genId();
  await db.insert(workoutSets).values({ id, userId, exerciseId, reps, performedAt });
  return id;
}

describe('listExercises', () => {
  it('returns only non-archived for owner', async () => {
    const userId = await makeUser();
    const a = await seedExercise(userId, 'A', `slug-a-${genId()}`);
    await seedExercise(userId, 'B', `slug-b-${genId()}`, new Date());
    const rows = await listExercises(userId);
    expect(rows.map((r) => r.id)).toEqual([a]);
  });

  it('does not leak across users', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    await seedExercise(owner, 'Mine', `slug-${genId()}`);
    const rows = await listExercises(intruder);
    expect(rows.length).toBe(0);
  });
});

describe('getExercise', () => {
  it('returns null for non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const id = await seedExercise(owner);
    const got = await getExercise(intruder, id);
    expect(got).toBeNull();
  });

  it('returns null for archived', async () => {
    const userId = await makeUser();
    const id = await seedExercise(userId, 'X', `slug-${genId()}`, new Date());
    const got = await getExercise(userId, id);
    expect(got).toBeNull();
  });
});

describe('listSetsForToday', () => {
  it('returns sets only from today, scoped by exercise when given', async () => {
    const userId = await makeUser();
    const exA = await seedExercise(userId, 'A', `a-${genId()}`);
    const exB = await seedExercise(userId, 'B', `b-${genId()}`);
    const todayMid = new Date();
    todayMid.setHours(12, 0, 0, 0);
    const yesterday = new Date(todayMid);
    yesterday.setDate(yesterday.getDate() - 1);
    await seedSet(userId, exA, 10, todayMid);
    await seedSet(userId, exA, 8, yesterday);
    await seedSet(userId, exB, 5, todayMid);

    const allToday = await listSetsForToday(userId);
    expect(allToday.length).toBe(2);

    const onlyA = await listSetsForToday(userId, exA);
    expect(onlyA.length).toBe(1);
    expect(onlyA[0].reps).toBe(10);
  });
});

describe('listSetsForRange', () => {
  it('respects from/to bounds', async () => {
    const userId = await makeUser();
    const ex = await seedExercise(userId);
    const d1 = new Date('2025-04-20T10:00:00Z');
    const d2 = new Date('2025-04-22T10:00:00Z');
    const d3 = new Date('2025-04-25T10:00:00Z');
    await seedSet(userId, ex, 5, d1);
    await seedSet(userId, ex, 6, d2);
    await seedSet(userId, ex, 7, d3);
    const rows = await listSetsForRange(
      userId,
      new Date('2025-04-21T00:00:00Z'),
      new Date('2025-04-23T00:00:00Z'),
    );
    expect(rows.length).toBe(1);
    expect(rows[0].reps).toBe(6);
  });
});

describe('summary', () => {
  it('aggregates totals correctly', async () => {
    const userId = await makeUser();
    const exA = await seedExercise(userId, 'A', `a-${genId()}`);
    const exB = await seedExercise(userId, 'B', `b-${genId()}`);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await seedSet(userId, exA, 10, today);
    await seedSet(userId, exA, 5, today);
    await seedSet(userId, exB, 7, today);
    await seedSet(userId, exA, 3, tenDaysAgo);

    const s = await summary(userId);
    expect(s.totalAllTime).toBe(25);
    expect(s.total7d).toBe(22);
    const a = s.byExercise.find((x) => x.exerciseId === exA);
    const b = s.byExercise.find((x) => x.exerciseId === exB);
    expect(a?.total).toBe(18);
    expect(b?.total).toBe(7);
  });

  it('includes exercises with zero sets', async () => {
    const userId = await makeUser();
    const ex = await seedExercise(userId, 'Empty', `e-${genId()}`);
    const s = await summary(userId);
    expect(s.totalAllTime).toBe(0);
    expect(s.byExercise).toEqual([{ exerciseId: ex, name: 'Empty', total: 0 }]);
  });
});
