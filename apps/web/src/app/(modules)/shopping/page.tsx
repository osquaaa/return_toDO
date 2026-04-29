import { requireUser } from '@/lib/auth/session';
import {
  countItemsByTrip,
  getCurrentTrip,
  listItems,
  listItemSuggestions,
  listTripsHistory,
} from '@/lib/shopping/queries';

import { ActiveTrip } from './active-trip';
import { HistoryPanel, type HistoryRow } from './history-panel';
import { StartTripButton } from './start-trip-button';

export const metadata = { title: 'Покупки — LETget' };
export const dynamic = 'force-dynamic';

export default async function ShoppingPage() {
  const user = await requireUser();
  const [trip, history, suggestions] = await Promise.all([
    getCurrentTrip(user.id),
    listTripsHistory(user.id),
    listItemSuggestions(user.id),
  ]);
  const items = trip ? await listItems(trip.id) : [];
  const counts = await countItemsByTrip(history.map((h) => h.id));

  const historyRows: HistoryRow[] = history.map((h) => ({
    id: h.id,
    name: h.name,
    completedAt: h.completedAt ? h.completedAt.toISOString() : null,
    counts: counts.get(h.id) ?? { total: 0, done: 0 },
  }));

  const itemRows = items.map((it) => ({
    id: it.id,
    name: it.name,
    quantity: it.quantity,
    isDone: it.isDone,
    position: it.position,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Покупки</h1>
          {trip && (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {trip.name} · {itemRows.length} {pluralItems(itemRows.length)}
            </p>
          )}
        </div>
        <span
          className="hidden h-10 w-10 rounded-full sm:block"
          style={{
            background:
              'linear-gradient(135deg, var(--color-shopping-from), var(--color-shopping-to))',
          }}
          aria-hidden
        />
      </header>

      {trip ? (
        <ActiveTrip
          tripId={trip.id}
          tripName={trip.name}
          items={itemRows}
          suggestions={suggestions}
        />
      ) : (
        <div className="rounded-2xl bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="mb-4 text-[var(--color-ink-soft)]">Активного похода нет.</p>
          <StartTripButton />
        </div>
      )}

      {historyRows.length > 0 && <HistoryPanel rows={historyRows} />}
    </div>
  );
}

function pluralItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'позиция';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции';
  return 'позиций';
}
