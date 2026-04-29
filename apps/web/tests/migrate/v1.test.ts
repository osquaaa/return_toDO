import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import {
  users,
  userPreferences,
  tasks,
  shoppingTrips,
  shoppingItems,
  codeSnippets,
  workoutExercises,
  workoutSets,
} from '@letget/db/schema';

import { importV1 } from '../../src/lib/migrate/v1';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `mig-${id}@test.local`, role: 'user' });
  await db.insert(userPreferences).values({ userId: id });
  return id;
}

describe('importV1', () => {
  it('imports a small payload and returns counts', async () => {
    const userId = await makeUser();
    const result = await importV1(userId, {
      tasks: [{ id: 'old1', text: 'Buy milk', isDone: false }],
      shopping: {
        trips: [{ id: 'tr1', name: 'Магнит', isCurrent: true }],
        items: [{ id: 'i1', tripId: 'tr1', name: 'Молоко', position: 0, isDone: false }],
      },
      code: [{ id: 'c1', code: 'x = 1', lang: 'js', title: 'init' }],
      workouts: {
        exercises: [{ id: 'pullups', name: 'Подтягивания', icon: '💪' }],
        sets: [{ id: 's1', exerciseId: 'pullups', reps: 12 }],
      },
    });
    expect(result.alreadyMigrated).toBe(false);
    expect(result.counts.tasks).toBe(1);
    expect(result.counts.shoppingItems).toBe(1);
    expect(result.counts.codeSnippets).toBe(1);
    expect(result.counts.workoutSets).toBe(1);

    const tRows = await db.select().from(tasks).where(eq(tasks.userId, userId));
    expect(tRows.length).toBe(1);
    const prefRows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    expect(prefRows[0].migratedV1At).not.toBeNull();
  });

  it('is idempotent — second call returns alreadyMigrated', async () => {
    const userId = await makeUser();
    await importV1(userId, {
      tasks: [],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    const second = await importV1(userId, {
      tasks: [{ id: 'late', text: 'should not import' }],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    expect(second.alreadyMigrated).toBe(true);
    const tRows = await db.select().from(tasks).where(eq(tasks.userId, userId));
    expect(tRows.length).toBe(0);
  });
});
