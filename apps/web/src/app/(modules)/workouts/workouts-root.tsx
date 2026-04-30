'use client';

import { Dumbbell, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';

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
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const heatmapDays: HeatmapDay[] = useMemo(() => buildHeatmap(last14days), [last14days]);

  const setsForActive = useMemo(
    () => todaySets.filter((s) => s.exerciseId === activeId),
    [todaySets, activeId],
  );

  if (exercises.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-[var(--color-accent-workouts-soft)]">
            <Dumbbell size={28} strokeWidth={2} className="text-[var(--color-accent-workouts)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
              Список упражнений пуст
            </h3>
            <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
              Добавь хотя бы одно упражнение — приседания, отжимания или что душе угодно.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            iconLeft={<Plus size={14} />}
            onClick={() => setModalOpen(true)}
          >
            Добавить упражнение
          </Button>
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
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 md:p-6">
          <SetCounter exerciseId={activeId} />

          <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
            <TodayList sets={setsForActive} />
          </div>

          {setsForActive.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-danger)]"
              >
                <RotateCcw size={11} />
                Сбросить сегодня
              </button>
            </div>
          )}
        </div>
      )}

      <SummaryCard summary={summary} />
      <Heatmap days={heatmapDays} />

      {modalOpen && <AddExerciseModal onClose={() => setModalOpen(false)} />}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Сбросить сегодняшние подходы?"
        description="Все подходы по этому упражнению за сегодня будут удалены."
        confirmLabel="Сбросить"
        variant="danger"
        loading={clearing}
        onConfirm={async () => {
          if (!activeId) return;
          setClearing(true);
          const r = await clearTodayAction(activeId);
          setClearing(false);
          setConfirmClear(false);
          if (r.ok) toast.success('Сегодня сброшено');
          else toast.error(r.error);
        }}
      />
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
