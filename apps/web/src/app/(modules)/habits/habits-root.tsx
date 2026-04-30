'use client';

import { Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

import { AddHabitModal } from './add-habit-modal';
import { HabitRow } from './habit-row';
import { HabitsHero } from './habits-hero';
import type { CheckinDTO, HabitDTO } from './types';

const WEEKDAY_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

type Props = {
  habits: HabitDTO[];
  checkins: CheckinDTO[];
  todayCheckins: { id: string; habitId: string; performedOn: string; count: number }[];
  streaks: Record<string, number>;
  todayKey: string;
  bestStreak: number;
};

export function HabitsRoot({
  habits,
  checkins,
  todayCheckins,
  streaks,
  todayKey,
  bestStreak,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [addOpen, setAddOpen] = useState(false);

  const last14 = useMemo(() => buildLast14(todayKey), [todayKey]);
  const weekStripDays = useMemo(() => buildWeekStrip(todayKey), [todayKey]);

  // Map: habitId -> Map<dateISO, count>
  const checkinIndex = useMemo(() => {
    const idx = new Map<string, Map<string, number>>();
    for (const c of checkins) {
      if (!idx.has(c.habitId)) idx.set(c.habitId, new Map());
      idx.get(c.habitId)!.set(c.performedOn, c.count);
    }
    return idx;
  }, [checkins]);

  const doneToday = useMemo(() => {
    let done = 0;
    for (const h of habits) {
      const map = checkinIndex.get(h.id);
      const cnt = map?.get(todayKey) ?? 0;
      if (cnt >= (h.frequency === 'n_per_week' ? 1 : h.targetCount)) done += 1;
    }
    // Use todayCheckins as a stronger source if available.
    if (todayCheckins.length > 0) {
      const set = new Set(todayCheckins.map((c) => c.habitId));
      done = habits.reduce((acc, h) => {
        const cnt = checkinIndex.get(h.id)?.get(todayKey) ?? 0;
        const target = h.frequency === 'daily' ? h.targetCount : 1;
        return acc + (set.has(h.id) && cnt >= target ? 1 : 0);
      }, 0);
    }
    return done;
  }, [habits, checkinIndex, todayKey, todayCheckins]);

  return (
    <>
      <HabitsHero totalHabits={habits.length} doneToday={doneToday} bestStreak={bestStreak} />

      {habits.length > 0 && (
        <section className="-mx-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
          <div className="flex min-w-max items-center gap-1.5">
            {weekStripDays.map((d) => {
              const isSelected = d.iso === selectedDay;
              const isToday = d.iso === todayKey;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDay(d.iso)}
                  className={cn(
                    'flex size-12 flex-col items-center justify-center rounded-2xl border text-xs font-medium transition-all md:size-14',
                    isSelected
                      ? 'border-[var(--color-accent-habits)] bg-[var(--color-accent-habits-soft)] text-[var(--color-accent-habits)] shadow-[var(--shadow-xs)]'
                      : isToday
                        ? 'border-[var(--color-fg-tertiary)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-primary)]'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-secondary)] hover:border-[var(--color-border-default)]',
                  )}
                >
                  <span className="text-[10px] tracking-wider uppercase">{d.dow}</span>
                  <span className="mt-0.5 text-base font-semibold tabular-nums">{d.dayNum}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {habits.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-habits)]/15 to-[var(--color-accent-habits)]/5">
            <Sparkles size={28} strokeWidth={2} className="text-[var(--color-accent-habits)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-[var(--color-fg-primary)]">
              Тут пока пусто
            </h3>
            <p className="max-w-xs text-sm text-[var(--color-fg-secondary)]">
              Заведи первую привычку — мини-цель, которую хочешь повторять каждый день.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] px-4 text-sm font-semibold text-[var(--color-brand-fg)] shadow-[var(--shadow-sm)]"
          >
            <Plus size={16} strokeWidth={2.6} />
            Добавить
          </button>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {habits.map((h) => {
            const map = checkinIndex.get(h.id);
            const count = map?.get(selectedDay) ?? 0;
            const cells = last14.map((iso) => ({
              date: iso,
              count: map?.get(iso) ?? 0,
            }));
            return (
              <HabitRow
                key={h.id}
                habit={h}
                performedOn={selectedDay}
                count={count}
                streak={streaks[h.id] ?? 0}
                isToday={selectedDay === todayKey}
                cells={cells}
              />
            );
          })}
        </ul>
      )}

      {habits.length > 0 && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Новая привычка"
          className="fixed right-5 bottom-5 z-20 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-[var(--color-brand-fg)] shadow-[var(--shadow-lg)] transition-transform hover:scale-105 active:scale-95 md:right-8 md:bottom-8"
        >
          <Plus size={22} strokeWidth={2.6} />
        </button>
      )}

      <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function buildLast14(todayKey: string): string[] {
  const today = parseIso(todayKey);
  const out: string[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(toIso(d));
  }
  return out;
}

function buildWeekStrip(todayKey: string): { iso: string; dayNum: number; dow: string }[] {
  const today = parseIso(todayKey);
  const out: { iso: string; dayNum: number; dow: string }[] = [];
  // Render previous 6 days + today (so today sits at the right edge).
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = (d.getDay() + 6) % 7; // Mon = 0
    out.push({
      iso: toIso(d),
      dayNum: d.getDate(),
      dow: WEEKDAY_SHORT[dow] ?? '',
    });
  }
  return out;
}

function parseIso(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
