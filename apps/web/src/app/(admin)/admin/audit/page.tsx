import { Activity, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdminContext } from '@/lib/admin/guard';
import { listAuditActions, listAuditLog } from '@/lib/admin/audit-log';

export const metadata = { title: 'Админ — Audit log' };
export const dynamic = 'force-dynamic';

const LIMIT = 50;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string; page?: string }>;
}) {
  await requireAdminContext();
  const { search = '', action = '', page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [result, actions] = await Promise.all([
    listAuditLog({ search, action, page, limit: LIMIT }),
    listAuditActions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / LIMIT));

  const buildHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (action) sp.set('action', action);
    sp.set('page', String(nextPage));
    return `/admin/audit?${sp.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Activity size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Audit log
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Действия администраторов. Только чтение.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative h-10 min-w-[240px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]"
          />
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Email админа…"
            className="h-full w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-3.5 pl-9 text-sm text-[var(--color-fg-primary)] outline-none transition-colors placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-fg-tertiary)]"
          />
        </div>
        <select
          name="action"
          defaultValue={action}
          className="h-10 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
        >
          <option value="">Все действия</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <Button type="submit" variant="primary" size="md">
          Фильтр
        </Button>
      </form>

      <ul className="space-y-2">
        {result.rows.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 transition-colors hover:border-[var(--color-border-default)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-fg-tertiary)]">
                {new Date(r.createdAt).toLocaleString('ru-RU')}
              </span>
              <Badge variant="neutral" size="sm">
                {r.action}
              </Badge>
              <span className="font-mono text-xs text-[var(--color-fg-primary)]">
                {r.adminEmail}
              </span>
              {r.ipAddress && (
                <span className="ml-auto font-mono text-xs text-[var(--color-fg-tertiary)]">
                  {r.ipAddress}
                </span>
              )}
            </div>
            {r.targetType && (
              <div className="mt-2 text-xs text-[var(--color-fg-secondary)]">
                <span className="text-[var(--color-fg-tertiary)]">{r.targetType}:</span>{' '}
                <span className="font-mono">{r.targetId ?? '—'}</span>
              </div>
            )}
            {r.metadata && (
              <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--color-bg-subtle)] p-2.5 font-mono text-[10px] leading-tight text-[var(--color-fg-secondary)]">
                {JSON.stringify(r.metadata, null, 2)}
              </pre>
            )}
          </li>
        ))}
        {result.rows.length === 0 && (
          <li className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-12 text-center text-sm text-[var(--color-fg-secondary)]">
            Пусто.
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between text-sm text-[var(--color-fg-secondary)]">
        <div>
          Страница {result.page} / {totalPages} · всего {result.total}
        </div>
        <div className="flex gap-2">
          {result.page > 1 && (
            <Link
              href={buildHref(result.page - 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <ArrowLeft size={14} />
              Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={buildHref(result.page + 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              Вперёд
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
