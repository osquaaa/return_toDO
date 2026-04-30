import Link from 'next/link';

import { requireAdminContext } from '@/lib/admin/guard';
import { listLoginHistory } from '@/lib/admin/login-history';

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
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">История логинов</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Жёлтым / красным подсвечены подозрительные IP (5+ неудачных попыток за час).
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Email или IP…"
          className="min-w-[240px] flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-from)]"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="all">Все</option>
          <option value="success">Успешные</option>
          <option value="failed">Неудачные</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-from)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Фильтр
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-xs uppercase text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Когда</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Успех</th>
              <th className="px-3 py-2">Причина</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => {
              const rowClass = r.suspicious ? (r.success ? 'bg-amber-50' : 'bg-red-50') : '';
              return (
                <tr
                  key={r.id}
                  className={`border-t border-[var(--color-border)] align-top ${rowClass}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {new Date(r.attemptedAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.userId ? (
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="text-[var(--color-brand-from)] underline"
                      >
                        {r.email}
                      </Link>
                    ) : (
                      r.email
                    )}
                  </td>
                  <td className={`px-3 py-2 text-xs ${r.success ? '' : 'text-red-700'}`}>
                    {r.success ? '✓' : '✗'}
                  </td>
                  <td className="px-3 py-2 text-xs text-red-700">{r.failureReason ?? ''}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.ipAddress ?? ''}
                    {r.suspicious && (
                      <span className="ml-1 rounded bg-red-200 px-1 text-[10px] font-medium text-red-900">
                        SUSPICIOUS
                      </span>
                    )}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                    {r.userAgent ?? ''}
                  </td>
                </tr>
              );
            })}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-ink-soft)]">
                  Нет записей.
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
              href={buildHref(result.page - 1)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-canvas)]"
            >
              ← Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={buildHref(result.page + 1)}
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
