'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Composer } from './composer';
import { SnippetCard } from './snippet-card';

export type SnippetRow = {
  id: string;
  title: string | null;
  code: string;
  language: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export function SnippetList({
  items,
  initialQuery,
  initialPinnedOnly,
}: {
  items: SnippetRow[];
  initialQuery: string;
  initialPinnedOnly: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [pinnedOnly, setPinnedOnly] = useState(initialPinnedOnly);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (q) p.set('q', q);
      else p.delete('q');
      if (pinnedOnly) p.set('pinned', 'true');
      else p.delete('pinned');
      startTransition(() => router.replace(`/code?${p.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pinnedOnly]);

  return (
    <div className="space-y-3">
      <Composer />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-panel)] px-3 py-1.5 text-sm">
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(e) => setPinnedOnly(e.target.checked)}
            className="size-4 cursor-pointer"
          />
          Только закреплённые
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по коду…"
          className="ml-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm focus:border-[var(--color-ink-soft)] focus:outline-none"
        />
      </div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
            Пусто. Создайте первый сниппет.
          </li>
        ) : (
          items.map((s) => <SnippetCard key={s.id} snippet={s} />)
        )}
      </ul>
    </div>
  );
}
