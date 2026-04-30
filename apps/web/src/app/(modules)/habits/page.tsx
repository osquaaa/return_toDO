import { requireUser } from '@/lib/auth/session';
import {
  computeStreaks,
  getTodayCheckins,
  listCheckinsForRange,
  listHabits,
} from '@/lib/habits/queries';

import { HabitsRoot } from './habits-root';

export const metadata = { title: 'Привычки — LETget' };
export const dynamic = 'force-dynamic';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function HabitsPage() {
  const user = await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 13);

  const [habitsList, rangeCheckins, todayCheckins, streaks] = await Promise.all([
    listHabits(user.id),
    listCheckinsForRange(user.id, toIsoDate(fromDate), toIsoDate(today)),
    getTodayCheckins(user.id),
    computeStreaks(user.id),
  ]);

  const habits = habitsList.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    frequency: h.frequency,
    targetCount: h.targetCount,
    createdAt: h.createdAt.toISOString(),
  }));

  const checkins = rangeCheckins.map((c) => ({
    id: c.id,
    habitId: c.habitId,
    performedOn: c.performedOn as unknown as string,
    count: c.count,
    notes: c.notes,
  }));

  const todayCheckinsSerialized = todayCheckins.map((c) => ({
    id: c.id,
    habitId: c.habitId,
    performedOn: c.performedOn as unknown as string,
    count: c.count,
  }));

  const todayKey = toIsoDate(today);
  const bestStreak = Math.max(0, ...Object.values(streaks));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <HabitsRoot
        habits={habits}
        checkins={checkins}
        todayCheckins={todayCheckinsSerialized}
        streaks={streaks}
        todayKey={todayKey}
        bestStreak={bestStreak}
      />
    </div>
  );
}
