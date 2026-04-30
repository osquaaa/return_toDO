import Link from 'next/link';

import { requireAdminContext } from '@/lib/admin/guard';
import { listNotifications, type NotificationsTab } from '@/lib/admin/notifications';

import { NotificationRowActions } from './row-actions';

export const metadata = { title: 'Админ — Очередь уведомлений' };
export const dynamic = 'force-dynamic';

const LIMIT = 30;
const TABS: { value: NotificationsTab; label: string }[] = [
  { value: 'pending', label: 'В очереди' },
  { value: 'sent', label: 'Отправлено' },
  { value: 'failed', label: 'Ошибки' },
];

const isTab = (v: string | undefined): v is NotificationsTab =>
  v === 'pending' || v === 'sent' || v === 'failed';

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  await requireAdminContext();
  const { tab: tabParam, page: pageStr } = await searchParams;
  const tab: NotificationsTab = isTab(tabParam) ? tabParam : 'pending';
  const page = Math.max(1, Number(pageStr) || 1);

  const result = await listNotifications(tab, page, LIMIT);
  const totalPages = Math.max(1, Math.ceil(result.total / LIMIT));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Очередь уведомлений</h1>
      </header>

      <nav className="flex gap-1 rounded-2xl bg-[var(--color-panel)] p-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/notifications?tab=${t.value}`}
            className={`rounded-xl px-3 py-1.5 text-sm ${
              t.value === tab
                ? 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-xs uppercase text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Событие</th>
              <th className="px-3 py-2">Запланировано</th>
              <th className="px-3 py-2">Отправлено</th>
              <th className="px-3 py-2">Попытки</th>
              <th className="px-3 py-2">Ошибка</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((n) => (
              <tr
                key={n.id}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-canvas)]"
              >
                <td className="px-3 py-2 font-mono text-xs">
                  <Link
                    href={`/admin/users/${n.userId}`}
                    className="text-[var(--color-brand-from)] underline"
                  >
                    {n.email}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-xs">
                    {n.eventType}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(n.scheduledFor).toLocaleString('ru-RU')}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {n.sentAt ? new Date(n.sentAt).toLocaleString('ru-RU') : '—'}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span
                    className={
                      n.attempts >= 5
                        ? 'font-mono text-red-700'
                        : n.attempts > 0
                          ? 'font-mono text-amber-700'
                          : 'font-mono'
                    }
                  >
                    {n.attempts}
                  </span>
                </td>
                <td className="max-w-[260px] px-3 py-2 text-xs text-red-700">
                  <div className="line-clamp-2">{n.lastError ?? ''}</div>
                </td>
                <td className="px-3 py-2 text-right">
                  <NotificationRowActions
                    id={n.id}
                    canRetry={tab === 'failed'}
                    canCancel={tab === 'pending'}
                  />
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--color-ink-soft)]">
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
              href={`/admin/notifications?tab=${tab}&page=${result.page - 1}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-canvas)]"
            >
              ← Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={`/admin/notifications?tab=${tab}&page=${result.page + 1}`}
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
