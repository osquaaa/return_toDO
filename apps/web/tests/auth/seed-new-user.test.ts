import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, userPreferences, workoutExercises } from '@letget/db/schema';
import { seedNewUser } from '../../src/lib/auth/seed-new-user';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `seed-${id}@test.local`, role: 'user' });
  return id;
}

describe('seedNewUser', () => {
  it('creates preferences row + 3 default exercises', async () => {
    const userId = await makeUser();
    await seedNewUser(db, userId);

    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    expect(prefs.length).toBe(1);

    const exs = await db.select().from(workoutExercises).where(eq(workoutExercises.userId, userId));
    expect(exs.length).toBe(3);
    const slugs = exs.map((e) => e.slug).sort();
    expect(slugs).toEqual(['dips', 'pullups', 'pushups']);
  });

  it('is idempotent — calling twice does not duplicate', async () => {
    const userId = await makeUser();
    await seedNewUser(db, userId);
    await seedNewUser(db, userId);
    const exs = await db.select().from(workoutExercises).where(eq(workoutExercises.userId, userId));
    expect(exs.length).toBe(3);
  });
});
