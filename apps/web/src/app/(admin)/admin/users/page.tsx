import { ArrowLeft, ArrowRight, ChevronRight, Search, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { requireAdminContext } from '@/lib/admin/guard';
import { listAdminUsers } from '@/lib/admin/users';

export const metadata = { title: 'Админ — Юзеры' };
export const dynamic = 'force-dynamic';

const LIMIT = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireAdminContext();
  const { search, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const result = await listAdminUsers({ search, page, limit: LIMIT });
  const totalPages = Math.max(1, Math.ceil(result.total / LIMIT));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Users size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Юзеры
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Всего {result.total.toLocaleString('ru-RU')}.
        </p>
      </header>

      <form className="relative h-10 max-w-md">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-fg-tertiary)]"
        />
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Поиск по email…"
          className="h-full w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] pr-3.5 pl-9 text-sm text-[var(--color-fg-primary)] outline-none transition-colors placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-fg-tertiary)]"
        />
      </form>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 text-left text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Имя</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">TG</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">T/S/C/W</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((u) => (
                <tr
                  key={u.id}
                  className="group border-b border-[var(--color-border-subtle)] transition-colors last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-mono text-xs text-[var(--color-fg-primary)] hover:underline"
                    >
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-primary)]">
                    {u.name ?? <span className="text-[var(--color-fg-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.telegramLinked ? (
                      <Badge variant="success" size="sm">
                        ON
                      </Badge>
                    ) : (
                      <span className="text-[var(--color-fg-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-fg-secondary)]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ru-RU') : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-fg-secondary)]">
                    {u.tasksCount}/{u.shoppingItemsCount}/{u.codeSnippetsCount}/{u.workoutSetsCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      aria-label="Открыть"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-[var(--color-fg-tertiary)] transition-colors group-hover:bg-[var(--color-bg-hover)] group-hover:text-[var(--color-fg-primary)]"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[var(--color-fg-secondary)]"
                  >
                    Не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--color-fg-secondary)]">
        <div>
          Страница {result.page} / {totalPages}
        </div>
        <div className="flex gap-2">
          {result.page > 1 && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(result.page - 1) }).toString()}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <ArrowLeft size={14} />
              Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(result.page + 1) }).toString()}`}
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
