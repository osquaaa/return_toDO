'use client';

import { X } from 'lucide-react';
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
    return (
      <p className="text-center text-sm text-[var(--color-fg-tertiary)]">Сегодня пока пусто.</p>
    );
  }

  const visible = sets.slice(0, 5);
  const todaysTotal = sets.reduce((acc, s) => acc + s.reps, 0);

  const onDelete = (id: string) => {
    startTransition(async () => void (await removeSetAction(id)));
  };

  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          Сегодня
        </span>
        <span className="text-xs text-[var(--color-fg-secondary)]">
          {sets.length} {pluralSets(sets.length)} · {todaysTotal} повт.
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border-subtle)]">
        {visible.map((s) => (
          <li key={s.id} className="group flex items-center gap-3 py-2 text-sm">
            <span className="text-base font-semibold tabular-nums text-[var(--color-fg-primary)]">
              {s.reps}
            </span>
            <span className="text-xs text-[var(--color-fg-secondary)]">{pluralReps(s.reps)}</span>
            <span className="text-xs text-[var(--color-fg-tertiary)]">·</span>
            <span className="text-xs tabular-nums text-[var(--color-fg-tertiary)]">
              {formatTime(s.performedAt)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              aria-label="Удалить подход"
              className="ml-auto flex size-6 items-center justify-center rounded-md text-[var(--color-fg-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      {sets.length > visible.length && (
        <p className="pt-1 text-center text-xs text-[var(--color-fg-tertiary)]">
          и ещё {sets.length - visible.length}
        </p>
      )}
    </div>
  );
}

function pluralReps(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'повт.';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'повт.';
  return 'повт.';
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
