'use client';

import { useTransition } from 'react';

import { removeSetAction } from './actions';

export type TodaySetRow = {
  id: string;
  exerciseId: string;
  reps: number;
  performedAt: string;
};

export function TodayList({ sets }: { sets: TodaySetRow[] }) {
  const [, startTransition] = useTransition();

  if (sets.length === 0) {
    return <p className="text-center text-sm text-[var(--color-ink-faint)]">Сегодня пока пусто.</p>;
  }

  const visible = sets.slice(0, 5);
  const todaysTotal = sets.reduce((acc, s) => acc + s.reps, 0);

  const onDelete = (id: string) => {
    startTransition(async () => void (await removeSetAction(id)));
  };

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
        <span>Сегодня</span>
        <span>
          {sets.length} {pluralSets(sets.length)} · {todaysTotal} повт.
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {visible.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="font-medium tabular-nums">{s.reps}</span>
            <span className="text-[var(--color-ink-soft)]">{pluralReps(s.reps)}</span>
            <span className="text-[var(--color-ink-faint)]">·</span>
            <span className="text-[var(--color-ink-soft)] tabular-nums">
              {formatTime(s.performedAt)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              aria-label="Удалить подход"
              className="ml-auto rounded-md px-2 py-0.5 text-xs text-[var(--color-ink-faint)] hover:bg-red-50 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {sets.length > visible.length && (
        <p className="pt-1 text-center text-xs text-[var(--color-ink-faint)]">
          и ещё {sets.length - visible.length}
        </p>
      )}
    </div>
  );
}

function pluralReps(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'повторение';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'повторения';
  return 'повторений';
}

function pluralSets(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'подход';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'подхода';
  return 'подходов';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
