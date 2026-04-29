import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, shoppingTrips, shoppingItems } from '@letget/db/schema';
import {
  startNewTrip,
  addItem,
  toggleItem,
  updateItem,
  deleteItem,
  reorderItems,
  completeTrip,
  repeatTrip,
} from '../../src/lib/shopping/mutations';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `sm-${id}@test.local`, role: 'user' });
  return id;
}

describe('startNewTrip', () => {
  it('closes previous current trip and opens a new one', async () => {
    const userId = await makeUser();
    const first = await startNewTrip(userId);
    expect(first.isCurrent).toBe(true);
    const second = await startNewTrip(userId, 'Вечерний поход');
    expect(second.isCurrent).toBe(true);
    expect(second.name).toBe('Вечерний поход');

    const firstFresh = await db.select().from(shoppingTrips).where(eq(shoppingTrips.id, first.id));
    expect(firstFresh[0].isCurrent).toBe(false);
    expect(firstFresh[0].completedAt).not.toBeNull();
  });

  it('uses default name when not provided', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    expect(trip.name).toBe('Поход');
  });
});

describe('addItem', () => {
  it('rejects when trip not owned by user', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const result = await addItem(intruder, trip.id, { name: 'hack' });
    expect(result).toBeNull();
    const rows = await db.select().from(shoppingItems).where(eq(shoppingItems.tripId, trip.id));
    expect(rows.length).toBe(0);
  });

  it('assigns sequential positions', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const a = await addItem(userId, trip.id, { name: 'Молоко' });
    const b = await addItem(userId, trip.id, { name: 'Хлеб' });
    const c = await addItem(userId, trip.id, { name: 'Сыр' });
    expect(a?.position).toBe(0);
    expect(b?.position).toBe(1);
    expect(c?.position).toBe(2);
  });

  it('keeps quantity null when not provided', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const it = await addItem(userId, trip.id, { name: 'Хлеб' });
    expect(it?.quantity).toBeNull();
  });
});

describe('toggleItem', () => {
  it('flips isDone and stamps doneAt', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const item = await addItem(userId, trip.id, { name: 'Молоко' });
    expect(item).not.toBeNull();
    const done = await toggleItem(userId, item!.id);
    expect(done?.isDone).toBe(true);
    expect(done?.doneAt).not.toBeNull();
    const undone = await toggleItem(userId, item!.id);
    expect(undone?.isDone).toBe(false);
    expect(undone?.doneAt).toBeNull();
  });

  it('rejects toggle for non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const item = await addItem(owner, trip.id, { name: 'Молоко' });
    const result = await toggleItem(intruder, item!.id);
    expect(result).toBeNull();
  });
});

describe('updateItem', () => {
  it('updates name and quantity', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const item = await addItem(userId, trip.id, { name: 'Молоко' });
    const updated = await updateItem(userId, item!.id, { name: 'Молоко 2.5%', quantity: '2 л' });
    expect(updated?.name).toBe('Молоко 2.5%');
    expect(updated?.quantity).toBe('2 л');
  });

  it('rejects for non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const item = await addItem(owner, trip.id, { name: 'secret' });
    const result = await updateItem(intruder, item!.id, { name: 'hacked' });
    expect(result).toBeNull();
  });
});

describe('deleteItem', () => {
  it('hard deletes when owner', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const item = await addItem(userId, trip.id, { name: 'gone' });
    const ok = await deleteItem(userId, item!.id);
    expect(ok).toBe(true);
    const fresh = await db.select().from(shoppingItems).where(eq(shoppingItems.id, item!.id));
    expect(fresh.length).toBe(0);
  });

  it('rejects for non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const item = await addItem(owner, trip.id, { name: 'mine' });
    const ok = await deleteItem(intruder, item!.id);
    expect(ok).toBe(false);
  });
});

describe('reorderItems', () => {
  it('updates positions only for items in the given trip', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const a = await addItem(userId, trip.id, { name: 'A' });
    const b = await addItem(userId, trip.id, { name: 'B' });
    const c = await addItem(userId, trip.id, { name: 'C' });
    const updated = await reorderItems(userId, trip.id, [
      { id: a!.id, position: 2 },
      { id: b!.id, position: 0 },
      { id: c!.id, position: 1 },
    ]);
    expect(updated).toBe(3);
    const rows = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.tripId, trip.id))
      .orderBy(shoppingItems.position);
    expect(rows.map((r) => r.name)).toEqual(['B', 'C', 'A']);
  });

  it('rejects when trip not owned', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const a = await addItem(owner, trip.id, { name: 'A' });
    const updated = await reorderItems(intruder, trip.id, [{ id: a!.id, position: 99 }]);
    expect(updated).toBe(0);
  });
});

describe('completeTrip', () => {
  it('clears isCurrent and stamps completedAt', async () => {
    const userId = await makeUser();
    const trip = await startNewTrip(userId);
    const closed = await completeTrip(userId, trip.id);
    expect(closed?.isCurrent).toBe(false);
    expect(closed?.completedAt).not.toBeNull();
  });

  it('rejects non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const result = await completeTrip(intruder, trip.id);
    expect(result).toBeNull();
  });
});

describe('repeatTrip', () => {
  it('opens a new trip with only the unfinished items', async () => {
    const userId = await makeUser();
    const oldTrip = await startNewTrip(userId, 'Утренний поход');
    const a = await addItem(userId, oldTrip.id, { name: 'Молоко', quantity: '1 л' });
    const b = await addItem(userId, oldTrip.id, { name: 'Хлеб' });
    const c = await addItem(userId, oldTrip.id, { name: 'Сыр' });
    await toggleItem(userId, b!.id); // mark Хлеб done
    await completeTrip(userId, oldTrip.id);

    const newTrip = await repeatTrip(userId, oldTrip.id);
    expect(newTrip).not.toBeNull();
    expect(newTrip!.isCurrent).toBe(true);
    expect(newTrip!.name).toBe('Утренний поход');

    const newItems = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.tripId, newTrip!.id))
      .orderBy(shoppingItems.position);
    expect(newItems.map((r) => r.name)).toEqual(['Молоко', 'Сыр']);
    expect(newItems[0].quantity).toBe('1 л');

    // sanity: source trip still has its items intact
    const oldItems = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.tripId, oldTrip.id));
    expect(oldItems.length).toBe(3);
    void a;
    void c;
  });

  it('closes any existing current trip first', async () => {
    const userId = await makeUser();
    const oldTrip = await startNewTrip(userId);
    await addItem(userId, oldTrip.id, { name: 'Хлеб' });
    await completeTrip(userId, oldTrip.id);

    const interim = await startNewTrip(userId);
    const newTrip = await repeatTrip(userId, oldTrip.id);
    expect(newTrip).not.toBeNull();

    const interimFresh = await db
      .select()
      .from(shoppingTrips)
      .where(eq(shoppingTrips.id, interim.id));
    expect(interimFresh[0].isCurrent).toBe(false);

    // Only one current trip should exist for the user
    const currents = await db
      .select()
      .from(shoppingTrips)
      .where(and(eq(shoppingTrips.userId, userId), eq(shoppingTrips.isCurrent, true)));
    expect(currents.length).toBe(1);
    expect(currents[0].id).toBe(newTrip!.id);
  });

  it('rejects non-owner', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const trip = await startNewTrip(owner);
    const result = await repeatTrip(intruder, trip.id);
    expect(result).toBeNull();
  });
});
