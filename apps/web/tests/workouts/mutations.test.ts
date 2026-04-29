import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, workoutExercises, workoutSets } from '@letget/db/schema';
import {
  addExercise,
  archiveExercise,
  addSet,
  removeSet,
  clearTodaySets,
} from '../../src/lib/workouts/mutations';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `wm-${id}@test.local`, role: 'user' });
  return id;
}

describe('addExercise', () => {
  it('creates with auto-generated slug', async () => {
    const userId = await makeUser();
    const ex = await addExercise(userId, { name: 'Подтягивания', icon: '💪' });
    expect(ex.userId).toBe(userId);
    expect(ex.icon).toBe('💪');
    expect(ex.slug).toMatch(/[а-яё]+/iu);
  });

  it('falls back to suffixed slug on collision', async () => {
    const userId = await makeUser();
    const a = await addExercise(userId, { name: 'Test One' });
    const b = await addExercise(userId, { name: 'Test One' });
    expect(a.slug).not.toBe(b.slug);
  });

  it('uses fallback slug when name has no letters/digits', async () => {
    const userId = await makeUser();
    const ex = await addExercise(userId, { name: '!!!' });
    expect(ex.slug.startsWith('exercise')).toBe(true);
  });
});

describe('archiveExercise', () => {
  it('rejects non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const ex = await addExercise(owner, { name: 'Mine' });
    const ok = await archiveExercise(intruder, ex.id);
    expect(ok).toBe(false);
    const fresh = await db.select().from(workoutExercises).where(eq(workoutExercises.id, ex.id));
    expect(fresh[0].archivedAt).toBeNull();
  });

  it('stamps archivedAt for owner', async () => {
    const userId = await makeUser();
    const ex = await addExercise(userId, { name: 'A' });
    const ok = await archiveExercise(userId, ex.id);
    expect(ok).toBe(true);
    const fresh = await db.select().from(workoutExercises).where(eq(workoutExercises.id, ex.id));
    expect(fresh[0].archivedAt).not.toBeNull();
  });
});

describe('addSet', () => {
  it('returns null when exercise not owned', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const ex = await addExercise(owner, { name: 'X' });
    const set = await addSet(intruder, { exerciseId: ex.id, reps: 10 });
    expect(set).toBeNull();
  });

  it('inserts a set for the owner', async () => {
    const userId = await makeUser();
    const ex = await addExercise(userId, { name: 'X' });
    const set = await addSet(userId, { exerciseId: ex.id, reps: 12, notes: 'easy' });
    expect(set?.reps).toBe(12);
    expect(set?.notes).toBe('easy');
  });
});

describe('removeSet', () => {
  it('only owner can delete', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const ex = await addExercise(owner, { name: 'X' });
    const set = (await addSet(owner, { exerciseId: ex.id, reps: 5 }))!;
    const okIntruder = await removeSet(intruder, set.id);
    expect(okIntruder).toBe(false);
    const okOwner = await removeSet(owner, set.id);
    expect(okOwner).toBe(true);
  });
});

describe('clearTodaySets', () => {
  it('deletes only sets from today, optionally scoped', async () => {
    const userId = await makeUser();
    const exA = await addExercise(userId, { name: 'A' });
    const exB = await addExercise(userId, { name: 'B' });
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db
      .insert(workoutSets)
      .values({ id: genId(), userId, exerciseId: exA.id, reps: 1, performedAt: today });
    await db
      .insert(workoutSets)
      .values({ id: genId(), userId, exerciseId: exA.id, reps: 2, performedAt: yesterday });
    await db
      .insert(workoutSets)
      .values({ id: genId(), userId, exerciseId: exB.id, reps: 3, performedAt: today });

    const removedScoped = await clearTodaySets(userId, exA.id);
    expect(removedScoped).toBe(1);
    const remaining = await db.select().from(workoutSets).where(eq(workoutSets.userId, userId));
    expect(remaining.length).toBe(2);

    const removedAll = await clearTodaySets(userId);
    expect(removedAll).toBe(1);
    const last = await db.select().from(workoutSets).where(eq(workoutSets.userId, userId));
    expect(last.length).toBe(1);
    expect(last[0].reps).toBe(2); // yesterday survives
  });
});
