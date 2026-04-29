'use client';

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  reps: number;
};

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.reps));

  return (
    <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Последние 14 дней</h2>
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
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[10px] font-medium tabular-nums"
      style={{
        background:
          day.reps === 0
            ? 'var(--color-panel)'
            : `linear-gradient(135deg, color-mix(in srgb, var(--color-workout-from) ${Math.round(
                intensity * 100,
              )}%, var(--color-panel)), color-mix(in srgb, var(--color-workout-to) ${Math.round(
                intensity * 100,
              )}%, var(--color-panel)))`,
        color: intensity > 0.5 ? '#fff' : 'var(--color-ink-soft)',
      }}
    >
      {dayNum}
    </div>
  );
}

function monthLabel(m: number): string {
  return ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][m];
}
