import { Flame, ListChecks, Repeat, Sparkles } from 'lucide-react';

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

type Props = {
  totalHabits: number;
  doneToday: number;
  bestStreak: number;
};

export function HabitsHero({ totalHabits, doneToday, bestStreak }: Props) {
  const today = fmtToday();
  const allDone = totalHabits > 0 && doneToday >= totalHabits;
  const heading =
    totalHabits === 0
      ? 'Заведи первую привычку'
      : allDone
        ? 'Все привычки на сегодня готовы'
        : `${doneToday} из ${totalHabits} готово`;

  const subtitle =
    totalHabits === 0
      ? 'Маленькие ежедневные действия — большие изменения.'
      : bestStreak >= 7
        ? `Лучший стрик — ${bestStreak} ${plural(bestStreak, 'день', 'дня', 'дней')}. Не сбавляй темп.`
        : allDone
          ? 'Идеальный день. Так держать.'
          : 'Каждое касание — шаг вперёд.';

  return (
    <header className="space-y-4">
      <div className="space-y-0.5">
        <div className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          Сегодня · {today.weekday}, {today.date}
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[48px]">
          {heading}
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">{subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
        <Stat
          icon={<Repeat size={14} />}
          label="всего"
          value={totalHabits}
          tint="var(--color-fg-secondary)"
          softBg="var(--color-bg-subtle)"
        />
        <Stat
          icon={<ListChecks size={14} />}
          label="сегодня"
          value={doneToday}
          tint="var(--color-accent-habits)"
          softBg="var(--color-accent-habits-soft)"
        />
        <Stat
          icon={bestStreak > 0 ? <Flame size={14} /> : <Sparkles size={14} />}
          label="лучший стрик"
          value={bestStreak}
          tint={bestStreak > 0 ? 'var(--color-accent-shopping)' : 'var(--color-fg-tertiary)'}
          softBg={bestStreak > 0 ? 'var(--color-accent-shopping-soft)' : 'var(--color-bg-subtle)'}
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

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
