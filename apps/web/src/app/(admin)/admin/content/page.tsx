import { FileSearch, Search } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdminContext } from '@/lib/admin/guard';
import { searchAllContent } from '@/lib/admin/content';

export const metadata = { title: 'Админ — Контент' };
export const dynamic = 'force-dynamic';

const MODULES = [
  { value: 'all', label: 'Все' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'code', label: 'Код' },
  { value: 'shopping', label: 'Покупки' },
] as const;

const PERIODS = [
  { value: 'all', label: 'Всё время' },
  { value: '24h', label: '24 часа' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
] as const;

const moduleLabel = (m: string) =>
  m === 'tasks' ? 'Задачи' : m === 'code' ? 'Код' : m === 'shopping' ? 'Покупки' : m;

const moduleVariant = (m: string): 'tasks' | 'code' | 'shopping' | 'neutral' =>
  m === 'tasks' ? 'tasks' : m === 'code' ? 'code' : m === 'shopping' ? 'shopping' : 'neutral';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; module?: string; period?: string }>;
}) {
  await requireAdminContext();
  const { q = '', module: moduleParam = 'all', period = 'all' } = await searchParams;

  const rows = q
    ? await searchAllContent(q, {
        module: moduleParam !== 'all' ? moduleParam : undefined,
        period: period !== 'all' ? period : undefined,
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <FileSearch size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Контент
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Полнотекстовый поиск по задачам, коду и покупкам.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative h-10 min-w-[260px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Что искать…"
            className="h-full w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-3.5 pl-9 text-sm text-[var(--color-fg-primary)] outline-none transition-colors placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-fg-tertiary)]"
          />
        </div>
        <select
          name="module"
          defaultValue={moduleParam}
          className="h-10 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
        >
          {MODULES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          name="period"
          defaultValue={period}
          className="h-10 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="primary" size="md">
          Искать
        </Button>
      </form>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={`${r.module}-${r.contentId}`}
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 transition-colors hover:border-[var(--color-border-default)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={moduleVariant(r.module)} size="sm">
                {moduleLabel(r.module)}
              </Badge>
              <Link
                href={`/admin/users/${r.userId}`}
                className="font-mono text-xs text-[var(--color-fg-primary)] hover:underline"
              >
                {r.email}
              </Link>
              <span className="ml-auto font-mono text-xs text-[var(--color-fg-tertiary)]">
                {new Date(r.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-[var(--color-fg-secondary)]">
              {r.preview}
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-12 text-center text-sm text-[var(--color-fg-secondary)]">
            {q ? 'Ничего не найдено.' : 'Введи запрос для поиска.'}
          </li>
        )}
      </ul>

      {rows.length > 0 && (
        <p className="text-xs text-[var(--color-fg-tertiary)]">
          Показано {rows.length} результатов.
        </p>
      )}
    </div>
  );
}
