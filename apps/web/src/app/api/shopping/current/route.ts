import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth/session';
import {
  getCurrentTrip,
  listItems,
  listItemSuggestions,
  listTripsHistory,
  countItemsByTrip,
} from '@/lib/shopping/queries';

export async function GET() {
  const user = await requireUser();
  const [trip, history, suggestions] = await Promise.all([
    getCurrentTrip(user.id),
    listTripsHistory(user.id),
    listItemSuggestions(user.id),
  ]);
  const items = trip ? await listItems(trip.id) : [];
  const counts = await countItemsByTrip(history.map((h) => h.id));
  const historyWithCounts = history.map((h) => ({
    ...h,
    counts: counts.get(h.id) ?? { total: 0, done: 0 },
  }));
  return NextResponse.json({
    trip,
    items,
    history: historyWithCounts,
    suggestions,
  });
}
