'use client';

import { useTransition } from 'react';

import { bulkAction } from './actions';

export function TaskBulkBar({ selected, onClear }: { selected: Set<string>; onClear: () => void }) {
  const [isPending, startTransition] = useTransition();
  if (selected.size === 0) return null;
  const ids = Array.from(selected);
  const doAction = (action: 'done' | 'undone' | 'delete') => {
    startTransition(async () => {
      const r = await bulkAction(ids, action);
      if (r.ok) onClear();
    });
  };
  return (
    <div className="sticky bottom-4 mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-[var(--color-ink)] px-4 py-3 text-sm text-[var(--color-canvas)] shadow-[var(--shadow-lg)]">
      <span>Выбрано: {selected.size}</span>
      <div className="ml-auto flex gap-2">
        <button
          disabled={isPending}
          onClick={() => doAction('done')}
          className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          Сделать
        </button>
        <button
          disabled={isPending}
          onClick={() => doAction('undone')}
          className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          Не сделано
        </button>
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`Удалить ${selected.size} задач?`)) doAction('delete');
          }}
          className="rounded-lg bg-red-500/30 px-3 py-1 hover:bg-red-500/50"
        >
          Удалить
        </button>
        <button
          onClick={onClear}
          className="rounded-lg px-2 py-1 hover:bg-white/10"
          aria-label="Снять выделение"
        >
          ×
        </button>
      </div>
    </div>
  );
}
