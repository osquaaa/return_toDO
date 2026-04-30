import { ArrowLeft, ArrowRight, Check, LogIn, Search, X } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdminContext } from '@/lib/admin/guard';
import { listLoginHistory } from '@/lib/admin/login-history';
import { cn } from '@/lib/cn';

export const metadata = { title: 'Админ — История логинов' };
export const dynamic = 'force-dynamic';

const LIMIT = 50;

export default async function AdminLoginsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requireAdminContext();
  const { search = '', status = 'all', page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const result = await listLoginHistory({
    search,
    successOnly: status === 'success',
    failedOnly: status === 'failed',
    page,
    limit: LIMIT,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / LIMIT));

  const buildHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (status !== 'all') sp.set('status', status);
    sp.set('page', String(nextPage));
    return `/admin/logins?${sp.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <LogIn size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Логины
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Подсвечены подозрительные IP (5+ неудачных попыток за час).
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
            placeholder="Email или IP…"
            className="h-full w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-3.5 pl-9 text-sm text-[var(--color-fg-primary)] outline-none transition-colors placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-fg-tertiary)]"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-fg-primary)] outline-none focus:border-[var(--color-fg-tertiary)]"
        >
          <option value="all">Все</option>
          <option value="success">Успешные</option>
          <option value="failed">Неудачные</option>
        </select>
        <Button type="submit" variant="primary" size="md">
          Фильтр
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 text-left text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
                <th className="px-4 py-3">Когда</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Успех</th>
                <th className="px-4 py-3">Причина</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-[var(--color-border-subtle)] last:border-b-0',
                    r.suspicious && r.success && 'bg-[var(--color-warning-soft)]',
                    r.suspicious && !r.success && 'bg-[var(--color-danger-soft)]',
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-fg-secondary)]">
                    {new Date(r.attemptedAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {r.userId ? (
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="font-mono text-xs text-[var(--color-fg-primary)] hover:underline"
                      >
                        {r.email}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-[var(--color-fg-primary)]">
                        {r.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.success ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-md bg-[var(--color-success-soft)] text-[var(--color-success)]">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-md bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                        <X size={11} strokeWidth={3} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-danger)]">
                    {r.failureReason ?? ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[var(--color-fg-secondary)]">
                      {r.ipAddress ?? ''}
                    </span>
                    {r.suspicious && (
                      <Badge variant="danger" size="sm" className="ml-1.5">
                        SUSPICIOUS
                      </Badge>
                    )}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-xs text-[var(--color-fg-tertiary)]">
                    {r.userAgent ?? ''}
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-[var(--color-fg-secondary)]"
                  >
                    Нет записей.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
