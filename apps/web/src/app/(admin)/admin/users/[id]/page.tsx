import {
  Calendar,
  Check,
  CheckCircle2,
  Code2,
  Dumbbell,
  KeyRound,
  Mail,
  Send,
  Shield,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
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

  const initials = (detail.user.name ?? detail.user.email)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
        <div className="flex items-center gap-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 px-6 py-6 md:px-8">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-2xl font-semibold tracking-tight text-[var(--color-brand-fg)] shadow-[var(--shadow-md)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
              <Users size={12} strokeWidth={2.4} />
              Юзер
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-3xl">
              {detail.user.name ?? detail.user.email}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-fg-secondary)]">
              <span className="font-mono text-xs">{detail.user.email}</span>
              <Badge variant={detail.user.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                {detail.user.role}
              </Badge>
              {detail.user.emailVerified ? (
                <Badge variant="success" size="sm">
                  email verified
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  email unverified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-[var(--color-border-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Field icon={<Mail size={14} />} label="Email" value={detail.user.email} />
          <Field icon={<Shield size={14} />} label="Роль" value={detail.user.role} />
          <Field
            icon={<Calendar size={14} />}
            label="Создан"
            value={new Date(detail.user.createdAt).toLocaleString('ru-RU')}
          />
        </dl>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          icon={<CheckCircle2 size={14} />}
          tint="var(--color-accent-tasks)"
          softBg="var(--color-accent-tasks-soft)"
          label="tasks"
          value={countMap.tasks ?? 0}
        />
        <StatCard
          icon={<ShoppingBag size={14} />}
          tint="var(--color-accent-shopping)"
          softBg="var(--color-accent-shopping-soft)"
          label="shopping"
          value={countMap.shopping_items ?? 0}
        />
        <StatCard
          icon={<Code2 size={14} />}
          tint="var(--color-accent-code)"
          softBg="var(--color-accent-code-soft)"
          label="code"
          value={countMap.code_snippets ?? 0}
        />
        <StatCard
          icon={<Dumbbell size={14} />}
          tint="var(--color-accent-workouts)"
          softBg="var(--color-accent-workouts-soft)"
          label="workouts"
          value={countMap.workout_sets ?? 0}
        />
        <StatCard
          icon={<KeyRound size={14} />}
          tint="var(--color-fg-primary)"
          softBg="var(--color-bg-subtle)"
          label="active sessions"
          value={countMap.active_sessions ?? 0}
        />
      </section>

      <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 md:p-6">
        <header className="mb-4 flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]">
            <Send size={16} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
              Telegram
            </h2>
            <p className="text-sm text-[var(--color-fg-secondary)]">
              {detail.telegram ? 'Привязан.' : 'Не привязан.'}
            </p>
          </div>
        </header>
        {detail.telegram && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-[var(--color-fg-tertiary)]">@username</dt>
            <dd className="font-mono text-xs text-[var(--color-fg-primary)]">
              {detail.telegram.username ?? '—'}
            </dd>
            <dt className="text-[var(--color-fg-tertiary)]">Telegram ID</dt>
            <dd className="font-mono text-xs text-[var(--color-fg-primary)]">
              {detail.telegram.telegramId?.toString()}
            </dd>
            <dt className="text-[var(--color-fg-tertiary)]">Привязан</dt>
            <dd className="font-mono text-xs text-[var(--color-fg-primary)]">
              {detail.telegram.linkedAt
                ? new Date(detail.telegram.linkedAt).toLocaleString('ru-RU')
                : '—'}
            </dd>
          </dl>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
        <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/40 px-5 py-4 md:px-6">
          <h2 className="text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
            История логинов
          </h2>
          <p className="text-sm text-[var(--color-fg-secondary)]">Последние 30 попыток.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-left text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
                <th className="px-4 py-3">Когда</th>
                <th className="px-4 py-3">Успех</th>
                <th className="px-4 py-3">Причина</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">UA</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[var(--color-fg-secondary)]">
                    {new Date(h.attemptedAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-2.5">
                    {h.success ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-md bg-[var(--color-success-soft)] text-[var(--color-success)]">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex size-5 items-center justify-center rounded-md bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                        <X size={11} strokeWidth={3} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-danger)]">
                    {h.failureReason ?? ''}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[var(--color-fg-secondary)]">
                    {h.ipAddress ?? ''}
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-2.5 text-[var(--color-fg-tertiary)]">
                    {h.userAgent ?? ''}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-[var(--color-fg-secondary)]"
                  >
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

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 truncate font-mono text-xs font-medium text-[var(--color-fg-primary)]">
        {value}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  tint,
  softBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  softBg: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3.5">
      <span
        className="flex size-8 items-center justify-center rounded-lg"
        style={{ background: softBg, color: tint }}
      >
        {icon}
      </span>
      <div className="mt-2.5">
        <div className="text-xl font-semibold tabular-nums tracking-tight text-[var(--color-fg-primary)]">
          {value.toLocaleString('ru-RU')}
        </div>
        <div className="mt-0.5 text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {label}
        </div>
      </div>
    </div>
  );
}
