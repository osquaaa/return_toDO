import { requireUser } from '@/lib/auth/session';
import { listExercises, listSetsForRange, listSetsForToday, summary } from '@/lib/workouts/queries';

import { WorkoutsRoot } from './workouts-root';

export const metadata = { title: 'Тренировки — LETget' };
export const dynamic = 'force-dynamic';

export default async function WorkoutsPage() {
  const user = await requireUser();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [exercises, todaySets, sum, last14] = await Promise.all([
    listExercises(user.id),
    listSetsForToday(user.id),
    summary(user.id),
    listSetsForRange(user.id, fourteenDaysAgo, now),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Тренировки</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {exercises.length === 0
              ? 'Добавьте первое упражнение'
              : `${exercises.length} ${pluralExercises(exercises.length)}`}
          </p>
        </div>
        <span
          className="hidden h-10 w-10 rounded-full sm:block"
          style={{
            background:
              'linear-gradient(135deg, var(--color-workout-from), var(--color-workout-to))',
          }}
          aria-hidden
        />
      </header>

      <WorkoutsRoot
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
        }))}
        todaySets={todaySets.map((s) => ({
          id: s.id,
          exerciseId: s.exerciseId,
          reps: s.reps,
          performedAt: s.performedAt.toISOString(),
        }))}
        summary={sum}
        last14days={last14.map((s) => ({
          id: s.id,
          performedAt: s.performedAt.toISOString(),
          reps: s.reps,
        }))}
      />
    </div>
  );
}

function pluralExercises(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'упражнение';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'упражнения';
  return 'упражнений';
}
