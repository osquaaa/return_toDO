import { ArrowDownRight, ArrowUpRight, Scale, Wallet } from 'lucide-react';

import { formatRub, formatRubSigned } from './palette';

const MONTH_NOM = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTH_GEN_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

type Props = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  preset: 'month' | '3m' | 'year' | 'custom';
  from: string;
  to: string;
};

function periodLabel(preset: Props['preset'], from: string, to: string): string {
  const fromDate = parseIso(from);
  const toDate = parseIso(to);
  if (preset === 'month') {
    return `${MONTH_NOM[fromDate.getMonth()] ?? ''} ${fromDate.getFullYear()}`;
  }
  if (preset === 'year') return `${fromDate.getFullYear()} год`;
  if (preset === '3m') return 'Последние 3 месяца';
  // Custom range — show short form.
  const sameYear = fromDate.getFullYear() === toDate.getFullYear();
  const fromStr = `${fromDate.getDate()} ${MONTH_GEN_SHORT[fromDate.getMonth()] ?? ''}${
    sameYear ? '' : ' ' + fromDate.getFullYear()
  }`;
  const toStr = `${toDate.getDate()} ${MONTH_GEN_SHORT[toDate.getMonth()] ?? ''} ${toDate.getFullYear()}`;
  return `${fromStr} — ${toStr}`;
}

export function FinanceHero({ totalIncome, totalExpense, net, preset, from, to }: Props) {
  const period = periodLabel(preset, from, to);
  const positive = net > 0;
  const negative = net < 0;
  const heading = formatRubSigned(net);

  const subtitle =
    totalIncome === 0 && totalExpense === 0
      ? 'Добавь первую операцию — посмотрим, куда уходят деньги.'
      : `Доход ${formatRub(totalIncome)} · Расход ${formatRub(totalExpense)}`;

  return (
    <header className="space-y-4">
      <div className="space-y-0.5">
        <div className="text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          {period}
        </div>
        <h1
          className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight tabular-nums md:text-[48px]"
          style={{
            color: positive
              ? 'var(--color-success)'
              : negative
                ? 'var(--color-danger)'
                : 'var(--color-fg-primary)',
          }}
        >
          {heading}
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">{subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
        <Stat
          icon={<ArrowUpRight size={14} strokeWidth={2.6} />}
          label="доход"
          value={formatRub(totalIncome)}
          tint="var(--color-success)"
          softBg="var(--color-success-soft)"
        />
        <Stat
          icon={<ArrowDownRight size={14} strokeWidth={2.6} />}
          label="расход"
          value={formatRub(totalExpense)}
          tint="var(--color-danger)"
          softBg="var(--color-danger-soft)"
        />
        <Stat
          icon={positive || negative ? <Scale size={14} /> : <Wallet size={14} />}
          label="баланс"
          value={formatRubSigned(net)}
          tint={
            positive
              ? 'var(--color-success)'
              : negative
                ? 'var(--color-danger)'
                : 'var(--color-fg-secondary)'
          }
          softBg={
            positive
              ? 'var(--color-success-soft)'
              : negative
                ? 'var(--color-danger-soft)'
                : 'var(--color-bg-subtle)'
          }
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
  value: string;
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
        <div className="truncate text-sm leading-none font-semibold tracking-tight tabular-nums md:text-base">
          {value}
        </div>
        <div className="mt-0.5 truncate text-[10px] tracking-wider text-[var(--color-fg-tertiary)] uppercase md:text-[11px]">
          {label}
        </div>
      </div>
    </div>
  );
}

function parseIso(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}
