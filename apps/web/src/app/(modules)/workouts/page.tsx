import { Dumbbell } from 'lucide-react';

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

  const todayReps = todaySets.reduce((acc, s) => acc + s.reps, 0);
  const todaySetsCount = todaySets.length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Dumbbell size={12} strokeWidth={2.4} />
          Тренировки
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Сегодня
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          {exercises.length === 0
            ? 'Добавь первое упражнение и сделай первый подход.'
            : todaySetsCount === 0
              ? 'Подходов сегодня ещё нет. Время начать.'
              : `${todaySetsCount} ${pluralSets(todaySetsCount)} · ${todayReps} ${pluralReps(todayReps)}.`}
        </p>
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

function pluralSets(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'подход';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'подхода';
  return 'подходов';
}

function pluralReps(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'повторение';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'повторения';
  return 'повторений';
}
