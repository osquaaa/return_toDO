'use client';

import { CheckSquare, Keyboard, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { cn } from '@/lib/cn';

const FILTERS = [
  { key: 'active', label: 'Активные' },
  { key: 'done', label: 'Сделано' },
  { key: 'all', label: 'Все' },
] as const;

type Props = {
  initialFilter: string;
  initialQuery: string;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  onShowShortcuts: () => void;
  selectionCount: number;
};

export function TaskFilters({
  initialFilter,
  initialQuery,
  selectionMode,
  onToggleSelectionMode,
  onShowShortcuts,
  selectionCount,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (q === initialQuery) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (q) p.set('q', q);
      else p.delete('q');
      startTransition(() => router.replace(`/tasks?${p.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setFilter = (f: string) => {
    const p = new URLSearchParams(params.toString());
    p.set('filter', f);
    router.replace(`/tasks?${p.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="flex h-10 gap-0.5 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
        {FILTERS.map((f) => {
          const active = initialFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex-1 rounded-xl px-3 text-sm font-medium tracking-tight transition-all sm:flex-none',
                active
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <div className="relative h-10 flex-1 sm:w-60 sm:flex-none">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск…"
            className="h-full w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-9 pl-9 text-sm text-[var(--color-fg-primary)] outline-none transition-colors placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-fg-tertiary)]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Очистить"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-fg-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleSelectionMode}
          aria-label={selectionMode ? 'Выйти из выбора' : 'Выбрать задачи'}
          className={cn(
            'flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-sm font-medium transition-all',
            selectionMode
              ? 'border-transparent bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)] shadow-[var(--shadow-xs)]'
              : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-secondary)] hover:border-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)]',
          )}
        >
          <CheckSquare size={14} />
          <span className="hidden sm:inline">
            {selectionMode ? `Готово${selectionCount ? ` (${selectionCount})` : ''}` : 'Выбрать'}
          </span>
        </button>

        <button
          type="button"
          onClick={onShowShortcuts}
          aria-label="Горячие клавиши"
          title="Горячие клавиши (?)"
          className="hidden h-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-[var(--color-fg-tertiary)] transition-colors hover:border-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-primary)] sm:flex"
        >
          <Keyboard size={14} />
        </button>
      </div>
    </div>
  );
}
