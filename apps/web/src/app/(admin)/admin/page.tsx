import { requireAdminContext } from '@/lib/admin/guard';
import { getDashboardMetrics, type Period } from '@/lib/admin/metrics';

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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <PeriodSwitcher current={period} />
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Всего юзеров" value={m.totalUsers} />
        <StatCard title="Новые" value={m.newUsers} sub={`за ${labelFor(period)}`} />
        <StatCard title="Активные" value={m.activeUsers} sub={`за ${labelFor(period)}`} />
        <StatCard
          title="Push: отправлено"
          value={m.pushStats.sent}
          sub={`pending ${m.pushStats.pending} / failed ${m.pushStats.failed}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Tasks" value={m.moduleActivity.tasks} />
        <StatCard title="Shopping items" value={m.moduleActivity.shoppingItems} />
        <StatCard title="Code snippets" value={m.moduleActivity.codeSnippets} />
        <StatCard title="Workout sets" value={m.moduleActivity.workoutSets} />
      </div>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="text-sm text-[var(--color-ink-soft)]">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{sub}</div>}
    </div>
  );
}

function PeriodSwitcher({ current }: { current: Period }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-[var(--color-panel)] p-1">
      {PERIODS.map((p) => (
        <a
          key={p}
          href={`/admin?period=${p}`}
          className={`rounded-xl px-3 py-1.5 text-sm ${
            current === p
              ? 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--color-ink-soft)]'
          }`}
        >
          {labelFor(p)}
        </a>
      ))}
    </div>
  );
}
