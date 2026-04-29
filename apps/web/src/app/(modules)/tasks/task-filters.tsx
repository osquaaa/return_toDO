'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const FILTERS = [
  { key: 'active', label: 'Активные' },
  { key: 'done', label: 'Сделано' },
  { key: 'all', label: 'Все' },
] as const;

export function TaskFilters({
  initialFilter,
  initialQuery,
}: {
  initialFilter: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (q) p.set('q', q);
      else p.delete('q');
      startTransition(() => router.replace(`/tasks?${p.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setFilter = (f: string) => {
    const p = new URLSearchParams(params.toString());
    p.set('filter', f);
    router.replace(`/tasks?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-2xl bg-[var(--color-panel)] p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-3 py-1.5 text-sm ${
              initialFilter === f.key
                ? 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--color-ink-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск…"
        className="ml-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm focus:border-[var(--color-ink-soft)] focus:outline-none"
      />
    </div>
  );
}
