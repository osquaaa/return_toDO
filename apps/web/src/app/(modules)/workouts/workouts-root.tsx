'use client';

import { useMemo, useState } from 'react';

import { ExerciseTabs, type ExerciseTab } from './exercise-tabs';
import { SetCounter } from './set-counter';
import { TodayList, type TodaySetRow } from './today-list';
import { SummaryCard } from './summary-card';
import { Heatmap, type HeatmapDay } from './heatmap';
import { AddExerciseModal } from './add-exercise-modal';
import { clearTodayAction } from './actions';

export type WorkoutSummary = {
  totalAllTime: number;
  total7d: number;
  byExercise: { exerciseId: string; name: string; total: number }[];
};

export function WorkoutsRoot({
  exercises,
  todaySets,
  summary,
  last14days,
}: {
  exercises: ExerciseTab[];
  todaySets: TodaySetRow[];
  summary: WorkoutSummary;
  last14days: { id: string; performedAt: string; reps: number }[];
}) {
  const [activeId, setActiveId] = useState<string | null>(exercises[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  const heatmapDays: HeatmapDay[] = useMemo(() => buildHeatmap(last14days), [last14days]);

  const setsForActive = useMemo(
    () => todaySets.filter((s) => s.exerciseId === activeId),
    [todaySets, activeId],
  );

  const onClearToday = () => {
    if (!activeId) return;
    if (!confirm('Сбросить сегодняшние подходы по этому упражнению?')) return;
    void clearTodayAction(activeId);
  };

  if (exercises.length === 0) {
    return (
      <>
        <div className="rounded-2xl bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="mb-4 text-[var(--color-ink-soft)]">Список упражнений пуст.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl px-5 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:opacity-90"
            style={{
              background:
                'linear-gradient(135deg, var(--color-workout-from), var(--color-workout-to))',
            }}
          >
            Добавить упражнение
          </button>
        </div>
        {modalOpen && <AddExerciseModal onClose={() => setModalOpen(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <ExerciseTabs
        items={exercises}
        activeId={activeId}
        onSelect={setActiveId}
        onAddClick={() => setModalOpen(true)}
      />

      {activeId && (
        <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <SetCounter exerciseId={activeId} />

          <div className="mt-5">
            <TodayList sets={setsForActive} />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClearToday}
              className="text-xs text-[var(--color-ink-faint)] hover:text-red-600"
            >
              Сбросить сегодня
            </button>
          </div>
        </div>
      )}

      <SummaryCard summary={summary} />
      <Heatmap days={heatmapDays} />

      {modalOpen && <AddExerciseModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function buildHeatmap(sets: { performedAt: string; reps: number }[]): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0, reps: 0 });
  }
  const byDate = new Map<string, HeatmapDay>(days.map((d) => [d.date, d]));
  for (const s of sets) {
    const key = new Date(s.performedAt).toISOString().slice(0, 10);
    const slot = byDate.get(key);
    if (slot) {
      slot.count += 1;
      slot.reps += s.reps;
    }
  }
  return days;
}
