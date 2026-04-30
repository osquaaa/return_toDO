import Link from 'next/link';

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
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Юзеры</h1>
        <form className="ml-auto">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Поиск по email…"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-from)]"
          />
        </form>
      </header>
      <div className="overflow-x-auto rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-xs uppercase text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Имя</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">TG</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2">Tasks/Shop/Code/WO</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((u) => (
              <tr
                key={u.id}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-canvas)]"
              >
                <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-2">{u.name ?? '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${u.role === 'admin' ? 'bg-[var(--color-brand-from)]/30' : 'bg-[var(--color-canvas)]'}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-2">{u.telegramLinked ? '✓' : ''}</td>
                <td className="px-3 py-2 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ru-RU') : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {u.tasksCount}/{u.shoppingItemsCount}/{u.codeSnippetsCount}/{u.workoutSetsCount}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-[var(--color-brand-from)] underline"
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--color-ink-soft)]">
                  Не найдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
        <div>
          Страница {result.page} / {totalPages} · всего {result.total}
        </div>
        <div className="flex gap-2">
          {result.page > 1 && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(result.page - 1) }).toString()}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-canvas)]"
            >
              ← Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(result.page + 1) }).toString()}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-canvas)]"
            >
              Вперёд →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
