'use client';

import { useTransition } from 'react';

import { repeatTripAction } from './actions';

export type HistoryRow = {
  id: string;
  name: string;
  completedAt: string | null;
  counts: { total: number; done: number };
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPanel({ rows }: { rows: HistoryRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        История
      </h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium">{r.name}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">{fmt(r.completedAt)}</span>
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                {r.counts.done} из {r.counts.total} {r.counts.total === 1 ? 'позиция' : 'позиций'}
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (confirm(`Повторить «${r.name}»?`))
                  startTransition(async () => void (await repeatTripAction(r.id)));
              }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-xs hover:border-[var(--color-shopping-to)] disabled:opacity-60"
            >
              Повторить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
