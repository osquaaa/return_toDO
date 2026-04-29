'use client';

import type { WorkoutSummary } from './workouts-root';

export function SummaryCard({ summary }: { summary: WorkoutSummary }) {
  return (
    <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Статистика</h2>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="За всё время" value={summary.totalAllTime} />
        <Stat label="За 7 дней" value={summary.total7d} />
      </div>

      {summary.byExercise.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3">
          {summary.byExercise.map((row) => (
            <li key={row.exerciseId} className="flex items-center justify-between text-sm">
              <span className="truncate text-[var(--color-ink)]">{row.name}</span>
              <span className="tabular-nums text-[var(--color-ink-soft)]">{row.total}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--color-panel)] p-4">
      <div className="text-xs text-[var(--color-ink-soft)]">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{formatNumber(value)}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU');
}
