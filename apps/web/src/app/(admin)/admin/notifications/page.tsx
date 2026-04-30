import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { requireAdminContext } from '@/lib/admin/guard';
import { listNotifications, type NotificationsTab } from '@/lib/admin/notifications';
import { cn } from '@/lib/cn';

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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Bell size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Очередь push
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Pending, отправленные и упавшие уведомления.
        </p>
      </header>

      <nav className="flex h-10 gap-0.5 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link
              key={t.value}
              href={`/admin/notifications?tab=${t.value}`}
              className={cn(
                'flex flex-1 items-center justify-center rounded-xl px-3 text-sm font-medium tracking-tight transition-all sm:flex-none',
                active
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 text-left text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Событие</th>
                <th className="px-4 py-3">Запланировано</th>
                <th className="px-4 py-3">Отправлено</th>
                <th className="px-4 py-3">Попытки</th>
                <th className="px-4 py-3">Ошибка</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((n) => (
                <tr
                  key={n.id}
                  className="border-b border-[var(--color-border-subtle)] transition-colors last:border-b-0 hover:bg-[var(--color-bg-hover)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${n.userId}`}
                      className="font-mono text-xs text-[var(--color-fg-primary)] hover:underline"
                    >
                      {n.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral" size="sm">
                      {n.eventType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-fg-secondary)]">
                    {new Date(n.scheduledFor).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-fg-secondary)]">
                    {n.sentAt ? new Date(n.sentAt).toLocaleString('ru-RU') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'font-mono text-xs',
                        n.attempts >= 5
                          ? 'text-[var(--color-danger)]'
                          : n.attempts > 0
                            ? 'text-[var(--color-warning)]'
                            : 'text-[var(--color-fg-secondary)]',
                      )}
                    >
                      {n.attempts}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-xs text-[var(--color-danger)]">
                    <div className="line-clamp-2">{n.lastError ?? ''}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
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
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[var(--color-fg-secondary)]"
                  >
                    Пусто.
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
              href={`/admin/notifications?tab=${tab}&page=${result.page - 1}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 text-sm font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-primary)]"
            >
              <ArrowLeft size={14} />
              Назад
            </Link>
          )}
          {result.page < totalPages && (
            <Link
              href={`/admin/notifications?tab=${tab}&page=${result.page + 1}`}
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
