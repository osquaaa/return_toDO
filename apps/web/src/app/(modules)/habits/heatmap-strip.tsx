'use client';

import { cn } from '@/lib/cn';

type Props = {
  /** Color in hex/named (e.g. emerald, amber). When null — habits accent token. */
  color: string | null;
  /** ISO date for each cell, oldest -> newest, length 14. */
  cells: { date: string; count: number }[];
};

export function HeatmapStrip({ color, cells }: Props) {
  const accent = color ?? 'var(--color-accent-habits)';
  const max = Math.max(1, ...cells.map((c) => c.count));

  return (
    <div className="flex items-center gap-[3px]">
      {cells.map((c) => {
        const intensity = c.count === 0 ? 0 : Math.max(0.25, c.count / max);
        const pct = Math.round(intensity * 100);
        return (
          <div
            key={c.date}
            title={`${formatLabel(c.date)} — ${c.count}`}
            className={cn(
              'h-3 w-2 rounded-[3px] transition-colors',
              c.count === 0 && 'border border-[var(--color-border-subtle)]',
            )}
            style={
              c.count === 0
                ? { background: 'var(--color-bg-subtle)' }
                : {
                    background: `color-mix(in srgb, ${accent} ${pct}%, var(--color-bg-subtle))`,
                  }
            }
          />
        );
      })}
    </div>
  );
}

const MONTH_SHORT = [
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

function formatLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()] ?? ''}`;
}
