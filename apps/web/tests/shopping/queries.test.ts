import { describe, it, expect } from 'vitest';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, shoppingTrips, shoppingItems } from '@letget/db/schema';
import {
  getCurrentTrip,
  listTripsHistory,
  listItems,
  listItemSuggestions,
  countItemsByTrip,
} from '../../src/lib/shopping/queries';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `sq-${id}@test.local`, role: 'user' });
  return id;
}

async function seedTrip(
  userId: string,
  opts: { isCurrent?: boolean; completedAt?: Date | null; name?: string } = {},
) {
  const id = genId();
  await db.insert(shoppingTrips).values({
    id,
    userId,
    name: opts.name ?? 'Поход',
    isCurrent: opts.isCurrent ?? false,
    completedAt: opts.completedAt ?? null,
  });
  return id;
}

async function seedItem(tripId: string, position: number, name: string, isDone = false) {
  const id = genId();
  await db.insert(shoppingItems).values({ id, tripId, name, position, isDone });
  return id;
}

describe('getCurrentTrip', () => {
  it('returns the trip flagged isCurrent', async () => {
    const userId = await makeUser();
    await seedTrip(userId, { completedAt: new Date('2025-01-01') });
    const currentId = await seedTrip(userId, { isCurrent: true });
    const got = await getCurrentTrip(userId);
    expect(got?.id).toBe(currentId);
  });

  it('returns null when none current', async () => {
    const userId = await makeUser();
    await seedTrip(userId, { completedAt: new Date('2025-01-01') });
    const got = await getCurrentTrip(userId);
    expect(got).toBeNull();
  });
});

describe('listTripsHistory', () => {
  it('returns only completed trips, newest first', async () => {
    const userId = await makeUser();
    const a = await seedTrip(userId, { completedAt: new Date('2025-01-01') });
    const b = await seedTrip(userId, { completedAt: new Date('2025-02-01') });
    await seedTrip(userId, { isCurrent: true });
    const rows = await listTripsHistory(userId);
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });
});

describe('listItems', () => {
  it('orders by position ascending', async () => {
    const userId = await makeUser();
    const tripId = await seedTrip(userId, { isCurrent: true });
    await seedItem(tripId, 2, 'Хлеб');
    await seedItem(tripId, 0, 'Молоко');
    await seedItem(tripId, 1, 'Яйца');
    const rows = await listItems(tripId);
    expect(rows.map((r) => r.name)).toEqual(['Молоко', 'Яйца', 'Хлеб']);
  });
});

describe('listItemSuggestions', () => {
  it('returns distinct names from user items, recent first', async () => {
    const userId = await makeUser();
    const t1 = await seedTrip(userId, { completedAt: new Date('2025-01-01') });
    const t2 = await seedTrip(userId, { isCurrent: true });
    await seedItem(t1, 0, 'Молоко');
    await seedItem(t1, 1, 'Хлеб');
    await seedItem(t2, 0, 'Молоко');
    const suggestions = await listItemSuggestions(userId);
    expect(suggestions).toContain('Молоко');
    expect(suggestions).toContain('Хлеб');
    expect(new Set(suggestions).size).toBe(suggestions.length);
  });

  it('does not leak names from other users', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await seedTrip(owner, { isCurrent: true });
    await seedItem(trip, 0, 'PrivateItem');
    const suggestions = await listItemSuggestions(intruder);
    expect(suggestions).not.toContain('PrivateItem');
  });
});

describe('countItemsByTrip', () => {
  it('counts total + done per trip', async () => {
    const userId = await makeUser();
    const a = await seedTrip(userId, { completedAt: new Date('2025-01-01') });
    await seedItem(a, 0, 'A1', true);
    await seedItem(a, 1, 'A2', false);
    await seedItem(a, 2, 'A3', true);
    const map = await countItemsByTrip([a]);
    expect(map.get(a)).toEqual({ total: 3, done: 2 });
  });

  it('returns empty map for empty input', async () => {
    const map = await countItemsByTrip([]);
    expect(map.size).toBe(0);
  });
});
