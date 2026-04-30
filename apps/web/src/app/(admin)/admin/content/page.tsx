import Link from 'next/link';

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
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Поиск по контенту</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Полнотекстовый поиск по задачам, коду и покупкам.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Что искать…"
          className="min-w-[260px] flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-from)]"
        />
        <select
          name="module"
          defaultValue={moduleParam}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
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
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-from)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Искать
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-xs uppercase text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Модуль</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Превью</th>
              <th className="px-3 py-2">Создано</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.module}-${r.contentId}`}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-canvas)]"
              >
                <td className="px-3 py-2">
                  <span className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-xs">
                    {moduleLabel(r.module)}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  <Link
                    href={`/admin/users/${r.userId}`}
                    className="text-[var(--color-brand-from)] underline"
                  >
                    {r.email}
                  </Link>
                </td>
                <td className="max-w-[500px] px-3 py-2">
                  <div className="line-clamp-2 text-[var(--color-ink-soft)]">{r.preview}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(r.createdAt).toLocaleString('ru-RU')}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[var(--color-ink-soft)]">
                  {q ? 'Ничего не найдено.' : 'Введите запрос для поиска.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <p className="text-xs text-[var(--color-ink-soft)]">Показано {rows.length} результатов.</p>
      )}
    </div>
  );
}
