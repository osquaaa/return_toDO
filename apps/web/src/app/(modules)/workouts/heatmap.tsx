'use client';

import { Activity } from 'lucide-react';

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  reps: number;
};

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.reps));

  return (
    <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 md:p-6">
      <header className="mb-3 flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
        <Activity size={12} strokeWidth={2.4} />
        Последние 14 дней
      </header>

      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <DayDot key={d.date} day={d} max={max} />
        ))}
      </div>
    </section>
  );
}

function DayDot({ day, max }: { day: HeatmapDay; max: number }) {
  const intensity = day.reps === 0 ? 0 : Math.max(0.18, day.reps / max);
  const date = new Date(day.date + 'T00:00:00');
  const dow = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  const dayNum = date.getDate();

  const title = `${dayNum} ${monthLabel(date.getMonth())} (${DAY_LABELS[dow]}): ${day.reps} повт. за ${day.count} подх.`;

  return (
    <div
      title={title}
      className="flex size-9 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] text-[10px] font-medium tabular-nums"
      style={{
        background:
          day.reps === 0
            ? 'var(--color-bg-subtle)'
            : `color-mix(in srgb, var(--color-accent-workouts) ${Math.round(intensity * 100)}%, var(--color-bg-subtle))`,
        color: intensity > 0.5 ? '#fff' : 'var(--color-fg-secondary)',
      }}
    >
      {dayNum}
    </div>
  );
}

function monthLabel(m: number): string {
  return ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][m];
}
