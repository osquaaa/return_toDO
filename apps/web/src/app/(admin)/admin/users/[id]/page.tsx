import { notFound } from 'next/navigation';

import { requireAdminContext } from '@/lib/admin/guard';
import { getAdminUserDetail, getUserLoginHistory } from '@/lib/admin/users';

import { DangerActions } from './danger-actions';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminContext();
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const history = await getUserLoginHistory(id, 30);
  const isSelf = ctx.user.id === id;

  const countMap = Object.fromEntries(detail.counts.map((c) => [c.key, c.count]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{detail.user.email}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Создан {new Date(detail.user.createdAt).toLocaleString('ru-RU')} · роль {detail.user.role}
          {detail.user.emailVerified ? ' · email подтверждён' : ' · email НЕ подтверждён'}
        </p>
      </header>

      <section className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 font-medium">Статистика</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Tasks" value={countMap.tasks ?? 0} />
          <Stat label="Shopping items" value={countMap.shopping_items ?? 0} />
          <Stat label="Code snippets" value={countMap.code_snippets ?? 0} />
          <Stat label="Workout sets" value={countMap.workout_sets ?? 0} />
          <Stat label="Active sessions" value={countMap.active_sessions ?? 0} />
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 font-medium">Telegram</h2>
        {detail.telegram ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-[var(--color-ink-soft)]">@username</dt>
            <dd className="font-mono">{detail.telegram.username ?? '—'}</dd>
            <dt className="text-[var(--color-ink-soft)]">Telegram ID</dt>
            <dd className="font-mono">{detail.telegram.telegramId?.toString()}</dd>
            <dt className="text-[var(--color-ink-soft)]">Привязан</dt>
            <dd>
              {detail.telegram.linkedAt
                ? new Date(detail.telegram.linkedAt).toLocaleString('ru-RU')
                : '—'}
            </dd>
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">Не привязан.</p>
        )}
      </section>

      <section className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <h2 className="mb-3 font-medium">История логинов (последние 30)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="text-left text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-2 py-1">Когда</th>
                <th className="px-2 py-1">Успех</th>
                <th className="px-2 py-1">Причина</th>
                <th className="px-2 py-1">IP</th>
                <th className="px-2 py-1">UA</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className={h.success ? '' : 'text-red-700'}>
                  <td className="px-2 py-1 font-mono">
                    {new Date(h.attemptedAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-2 py-1">{h.success ? '✓' : '✗'}</td>
                  <td className="px-2 py-1">{h.failureReason ?? ''}</td>
                  <td className="px-2 py-1 font-mono">{h.ipAddress ?? ''}</td>
                  <td className="px-2 py-1 max-w-[300px] truncate">{h.userAgent ?? ''}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[var(--color-ink-soft)]">
                    Нет записей.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DangerActions
        userId={id}
        email={detail.user.email}
        role={detail.user.role}
        isSelf={isSelf}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-[var(--color-ink-soft)]">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
