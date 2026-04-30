'use client';

import { Code2, Pin, Search, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/cn';

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
      startTransition(() => router.replace(`/code?${p.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pinnedOnly]);

  return (
    <div className="space-y-4">
      <Composer />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setPinnedOnly((v) => !v)}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-medium tracking-tight transition-colors',
            pinnedOnly
              ? 'border-[var(--color-accent-code)] bg-[var(--color-accent-code-soft)] text-[var(--color-accent-code)]'
              : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
          )}
        >
          <Pin size={14} strokeWidth={2.4} />
          Только закреплённые
        </button>

        <div className="relative h-10 sm:ml-auto sm:w-60">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по коду…"
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
      </div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="flex flex-col items-center gap-4 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-[var(--color-accent-code-soft)]">
              <Code2 size={28} className="text-[var(--color-accent-code)]" />
            </span>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
                Чистый ноут
              </h3>
              <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
                Сохраняй сюда команды, регулярки и куски, которые лень переписывать каждый раз.
              </p>
            </div>
          </li>
        ) : (
          items.map((s) => <SnippetCard key={s.id} snippet={s} />)
        )}
      </ul>
    </div>
  );
}
