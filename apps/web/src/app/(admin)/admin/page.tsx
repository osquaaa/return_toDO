import {
  Activity,
  Bell,
  CheckCircle2,
  Code2,
  Dumbbell,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

import { requireAdminContext } from '@/lib/admin/guard';
import { getDashboardMetrics, type Period } from '@/lib/admin/metrics';
import { cn } from '@/lib/cn';

const PERIODS = ['24h', '7d', '30d'] as const;

export const metadata = { title: 'Админ — Дашборд' };
export const dynamic = 'force-dynamic';

const labelFor = (p: Period) => ({ '24h': '24 часа', '7d': '7 дней', '30d': '30 дней' })[p];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdminContext();
  const { period: rawPeriod } = await searchParams;
  const period: Period = (PERIODS as readonly string[]).includes(rawPeriod ?? '')
    ? (rawPeriod as Period)
    : '7d';
  const m = await getDashboardMetrics(period);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            Админ
          </div>
          <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
            Дашборд
          </h1>
          <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
            Метрики за {labelFor(period).toLowerCase()}.
          </p>
        </div>
        <PeriodSwitcher current={period} />
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Users size={16} />}
          tint="var(--color-fg-primary)"
          softBg="var(--color-bg-subtle)"
          title="Всего юзеров"
          value={m.totalUsers}
        />
        <StatCard
          icon={<UserPlus size={16} />}
          tint="var(--color-accent-tasks)"
          softBg="var(--color-accent-tasks-soft)"
          title="Новые"
          value={m.newUsers}
          sub={`за ${labelFor(period)}`}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          tint="var(--color-accent-shopping)"
          softBg="var(--color-accent-shopping-soft)"
          title="Активные"
          value={m.activeUsers}
          sub={`за ${labelFor(period)}`}
        />
        <StatCard
          icon={<Bell size={16} />}
          tint="var(--color-accent-code)"
          softBg="var(--color-accent-code-soft)"
          title="Push отправлено"
          value={m.pushStats.sent}
          sub={`pending ${m.pushStats.pending} · failed ${m.pushStats.failed}`}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Activity size={12} strokeWidth={2.4} />
          Активность модулей
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ModuleCard
            icon={<CheckCircle2 size={16} />}
            tint="var(--color-accent-tasks)"
            softBg="var(--color-accent-tasks-soft)"
            title="Tasks"
            value={m.moduleActivity.tasks}
          />
          <ModuleCard
            icon={<ShoppingBag size={16} />}
            tint="var(--color-accent-shopping)"
            softBg="var(--color-accent-shopping-soft)"
            title="Shopping"
            value={m.moduleActivity.shoppingItems}
          />
          <ModuleCard
            icon={<Code2 size={16} />}
            tint="var(--color-accent-code)"
            softBg="var(--color-accent-code-soft)"
            title="Code"
            value={m.moduleActivity.codeSnippets}
          />
          <ModuleCard
            icon={<Dumbbell size={16} />}
            tint="var(--color-accent-workouts)"
            softBg="var(--color-accent-workouts-soft)"
            title="Workouts"
            value={m.moduleActivity.workoutSets}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  tint,
  softBg,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tint: string;
  softBg: string;
  title: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: softBg, color: tint }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
            {title}
          </div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-fg-primary)]">
            {value.toLocaleString('ru-RU')}
          </div>
        </div>
      </div>
      {sub && <div className="mt-2 truncate text-xs text-[var(--color-fg-tertiary)]">{sub}</div>}
    </div>
  );
}

function ModuleCard({
  icon,
  tint,
  softBg,
  title,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  softBg: string;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
      <span
        className="flex size-9 items-center justify-center rounded-xl"
        style={{ background: softBg, color: tint }}
      >
        {icon}
      </span>
      <div className="mt-3">
        <div className="text-[10px] tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {title}
        </div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-fg-primary)]">
          {value.toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
}

function PeriodSwitcher({ current }: { current: Period }) {
  return (
    <div className="flex h-10 gap-0.5 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
      {PERIODS.map((p) => {
        const active = current === p;
        return (
          <a
            key={p}
            href={`/admin?period=${p}`}
            className={cn(
              'rounded-xl px-3 text-sm font-medium tracking-tight transition-all flex items-center',
              active
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]',
            )}
          >
            {labelFor(p)}
          </a>
        );
      })}
    </div>
  );
}
