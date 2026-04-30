import { AlertCircle, CheckCircle2, ListTodo, Pin } from 'lucide-react';

const WEEKDAY = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTH = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function fmtToday(): { weekday: string; date: string } {
  const d = new Date();
  return {
    weekday: WEEKDAY[d.getDay()] ?? '',
    date: `${d.getDate()} ${MONTH[d.getMonth()] ?? ''}`,
  };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

type Stats = { total: number; done: number; pinned: number; overdue: number };

export function TasksHero({ name, stats }: { name: string | null; stats: Stats }) {
  const today = fmtToday();
  const firstName = name?.split(' ')[0] ?? '';

  return (
    <header className="space-y-5">
      <div className="space-y-1">
        <div className="text-xs font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {today.weekday}, {today.date}
        </div>
        <h1 className="text-balance text-[40px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[56px]">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="pt-1 text-base text-[var(--color-fg-secondary)]">
          {stats.total === 0
            ? 'Тут пока пусто. Добавь первую задачу.'
            : stats.done === stats.total
              ? 'Всё сделано — приятный день.'
              : `${stats.total - stats.done} активных, ${stats.done} сделано.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat
          icon={<ListTodo size={16} />}
          label="всего"
          value={stats.total}
          tint="var(--color-fg-secondary)"
          softBg="var(--color-bg-subtle)"
        />
        <Stat
          icon={<CheckCircle2 size={16} />}
          label="сделано"
          value={stats.done}
          tint="var(--color-accent-tasks)"
          softBg="var(--color-accent-tasks-soft)"
        />
        <Stat
          icon={<Pin size={16} />}
          label="закреплено"
          value={stats.pinned}
          tint="var(--color-accent-shopping)"
          softBg="var(--color-accent-shopping-soft)"
        />
        <Stat
          icon={<AlertCircle size={16} />}
          label="просрочено"
          value={stats.overdue}
          tint={stats.overdue > 0 ? 'var(--color-danger)' : 'var(--color-fg-tertiary)'}
          softBg={stats.overdue > 0 ? 'var(--color-danger-soft)' : 'var(--color-bg-subtle)'}
        />
      </div>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
  softBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
  softBg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: softBg, color: tint }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xl leading-none font-semibold tracking-tight">{value}</div>
        <div className="mt-0.5 truncate text-[11px] tracking-wider text-[var(--color-fg-tertiary)] uppercase">
          {label}
        </div>
      </div>
    </div>
  );
}
