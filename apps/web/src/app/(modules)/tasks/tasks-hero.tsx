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
    <header className="space-y-4">
      <div className="space-y-0.5">
        <div className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {today.weekday}, {today.date}
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[48px]">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          {stats.total === 0
            ? 'Тут пока пусто. Добавь первую задачу.'
            : stats.done === stats.total
              ? 'Всё сделано — приятный день.'
              : `${stats.total - stats.done} активных, ${stats.done} сделано.`}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 md:gap-2.5">
        <Stat
          icon={<ListTodo size={14} />}
          label="всего"
          value={stats.total}
          tint="var(--color-fg-secondary)"
          softBg="var(--color-bg-subtle)"
        />
        <Stat
          icon={<CheckCircle2 size={14} />}
          label="сделано"
          value={stats.done}
          tint="var(--color-accent-tasks)"
          softBg="var(--color-accent-tasks-soft)"
        />
        <Stat
          icon={<Pin size={14} />}
          label="пин"
          value={stats.pinned}
          tint="var(--color-accent-shopping)"
          softBg="var(--color-accent-shopping-soft)"
        />
        <Stat
          icon={<AlertCircle size={14} />}
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
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-2.5 md:flex-row md:items-center md:gap-3 md:px-3.5 md:py-3">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-lg md:size-9 md:rounded-xl"
        style={{ background: softBg, color: tint }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-lg leading-none font-semibold tracking-tight md:text-xl">{value}</div>
        <div className="mt-0.5 truncate text-[10px] tracking-wider text-[var(--color-fg-tertiary)] uppercase md:text-[11px]">
          {label}
        </div>
      </div>
    </div>
  );
}
