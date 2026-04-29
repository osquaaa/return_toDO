import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth/session';
import { listExercises, listSetsForToday, listSetsForRange, summary } from '@/lib/workouts/queries';

export async function GET() {
  const user = await requireUser();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13); // inclusive 14-day window

  const [exercises, today, sum, last14] = await Promise.all([
    listExercises(user.id),
    listSetsForToday(user.id),
    summary(user.id),
    listSetsForRange(user.id, fourteenDaysAgo, now),
  ]);

  return NextResponse.json({
    exercises,
    today,
    summary: sum,
    last14days: last14,
  });
}
