'use client';

import { Calendar, Trophy } from 'lucide-react';

import type { WorkoutSummary } from './workouts-root';

export function SummaryCard({ summary }: { summary: WorkoutSummary }) {
  return (
    <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 md:p-6">
      <header className="mb-4 flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
        <Trophy size={12} strokeWidth={2.4} />
        Статистика
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="за всё время"
          value={summary.totalAllTime}
          icon={<Trophy size={14} />}
          tint="var(--color-accent-workouts)"
          softBg="var(--color-accent-workouts-soft)"
        />
        <Stat
          label="за 7 дней"
          value={summary.total7d}
          icon={<Calendar size={14} />}
          tint="var(--color-fg-primary)"
          softBg="var(--color-bg-subtle)"
        />
      </div>

      {summary.byExercise.length > 0 && (
        <ul className="mt-5 space-y-1.5 border-t border-[var(--color-border-subtle)] pt-4">
          {summary.byExercise.map((row) => (
            <li key={row.exerciseId} className="flex items-center justify-between text-sm">
              <span className="truncate text-[var(--color-fg-primary)]">{row.name}</span>
              <span className="tabular-nums text-[var(--color-fg-secondary)]">{row.total}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
  softBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
  softBg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: softBg, color: tint }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
          {formatNumber(value)}
        </div>
        <div className="mt-1 text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {label}
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU');
}
