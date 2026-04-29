import type { Db } from '@letget/db/client';
import { genId } from '@letget/db';
import { userPreferences, workoutExercises } from '@letget/db/schema';

const DEFAULT_EXERCISES: { name: string; slug: string; icon: string }[] = [
  { name: 'Подтягивания', slug: 'pullups', icon: '💪' },
  { name: 'Брусья', slug: 'dips', icon: '🤸' },
  { name: 'Отжимания', slug: 'pushups', icon: '👊' },
];

export async function seedNewUser(db: Db, userId: string): Promise<void> {
  await db.insert(userPreferences).values({ userId }).onConflictDoNothing();
  await db
    .insert(workoutExercises)
    .values(
      DEFAULT_EXERCISES.map((e) => ({
        id: genId(),
        userId,
        name: e.name,
        slug: e.slug,
        icon: e.icon,
      })),
    )
    .onConflictDoNothing();
}
