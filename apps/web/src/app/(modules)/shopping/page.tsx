import { ShoppingBag } from 'lucide-react';

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

  const doneCount = itemRows.filter((it) => it.isDone).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8 md:py-10">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <ShoppingBag size={12} strokeWidth={2.4} />
          Покупки
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          {trip ? trip.name : 'Список'}
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          {trip
            ? itemRows.length === 0
              ? 'Поход начат — добавь первую позицию.'
              : `${doneCount} из ${itemRows.length} ${pluralItems(itemRows.length)} куплено.`
            : 'Начни новый поход и собери список под него.'}
        </p>
      </header>

      {trip ? (
        <ActiveTrip
          tripId={trip.id}
          tripName={trip.name}
          items={itemRows}
          suggestions={suggestions}
        />
      ) : (
        <StartTripButton />
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
