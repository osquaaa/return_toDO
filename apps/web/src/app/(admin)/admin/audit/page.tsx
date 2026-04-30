import Link from 'next/link';

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
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Действия администраторов. Только чтение.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Email админа…"
          className="min-w-[240px] flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-from)]"
        />
        <select
          name="action"
          defaultValue={action}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">Все действия</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
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
              <th className="px-3 py-2">Админ</th>
              <th className="px-3 py-2">Действие</th>
              <th className="px-3 py-2">Цель</th>
              <th className="px-3 py-2">Метаданные</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-border)] align-top">
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(r.createdAt).toLocaleString('ru-RU')}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.adminEmail}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-xs">
                    {r.action}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.targetType ? (
                    <div>
                      <span className="text-[var(--color-ink-soft)]">{r.targetType}:</span>{' '}
                      <span className="font-mono">{r.targetId ?? '—'}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="max-w-[300px] px-3 py-2 font-mono text-xs">
                  {r.metadata ? (
                    <pre className="whitespace-pre-wrap break-words text-[10px] leading-tight text-[var(--color-ink-soft)]">
                      {JSON.stringify(r.metadata, null, 2)}
                    </pre>
                  ) : (
                    ''
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.ipAddress ?? ''}</td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-ink-soft)]">
                  Пусто.
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
