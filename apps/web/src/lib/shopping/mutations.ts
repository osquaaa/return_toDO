import { and, eq, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import {
  shoppingItems,
  shoppingTrips,
  type ShoppingItem,
  type ShoppingTrip,
} from '@letget/db/schema';
import type { AddItemInput, ReorderItemsInput, UpdateItemInput } from '@letget/lib/zod/shopping';

const { db } = createDbClient();

export async function startNewTrip(userId: string, name?: string): Promise<ShoppingTrip> {
  return await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(shoppingTrips)
      .set({ isCurrent: false, completedAt: now, updatedAt: now })
      .where(and(eq(shoppingTrips.userId, userId), eq(shoppingTrips.isCurrent, true)));

    const tripId = genId();
    const [row] = await tx
      .insert(shoppingTrips)
      .values({
        id: tripId,
        userId,
        name: name && name.trim() ? name.trim() : 'Поход',
        isCurrent: true,
      })
      .returning();
    return row;
  });
}

async function assertTripOwned(userId: string, tripId: string): Promise<ShoppingTrip | null> {
  const rows = await db
    .select()
    .from(shoppingTrips)
    .where(and(eq(shoppingTrips.id, tripId), eq(shoppingTrips.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

async function assertItemOwned(userId: string, itemId: string): Promise<ShoppingItem | null> {
  const rows = await db
    .select({ item: shoppingItems })
    .from(shoppingItems)
    .innerJoin(shoppingTrips, eq(shoppingItems.tripId, shoppingTrips.id))
    .where(and(eq(shoppingItems.id, itemId), eq(shoppingTrips.userId, userId)))
    .limit(1);
  return rows[0]?.item ?? null;
}

export async function addItem(
  userId: string,
  tripId: string,
  input: AddItemInput,
): Promise<ShoppingItem | null> {
  const trip = await assertTripOwned(userId, tripId);
  if (!trip) return null;

  const maxPosRows = await db
    .select({ max: sql<number | null>`max(${shoppingItems.position})` })
    .from(shoppingItems)
    .where(eq(shoppingItems.tripId, tripId));
  const nextPosition = (maxPosRows[0]?.max ?? -1) + 1;

  const [row] = await db
    .insert(shoppingItems)
    .values({
      id: genId(),
      tripId,
      name: input.name.trim(),
      quantity: input.quantity?.trim() || null,
      position: nextPosition,
    })
    .returning();
  return row;
}

export async function toggleItem(userId: string, itemId: string): Promise<ShoppingItem | null> {
  const existing = await assertItemOwned(userId, itemId);
  if (!existing) return null;
  const nextDone = !existing.isDone;
  const [row] = await db
    .update(shoppingItems)
    .set({
      isDone: nextDone,
      doneAt: nextDone ? new Date() : null,
    })
    .where(eq(shoppingItems.id, itemId))
    .returning();
  return row ?? null;
}

export async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<ShoppingItem | null> {
  const existing = await assertItemOwned(userId, itemId);
  if (!existing) return null;

  const patch: Partial<typeof shoppingItems.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.quantity !== undefined) patch.quantity = input.quantity?.trim() || null;
  if (input.isDone !== undefined) {
    patch.isDone = input.isDone;
    patch.doneAt = input.isDone ? new Date() : null;
  }
  if (Object.keys(patch).length === 0) return existing;

  const [row] = await db
    .update(shoppingItems)
    .set(patch)
    .where(eq(shoppingItems.id, itemId))
    .returning();
  return row ?? null;
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const existing = await assertItemOwned(userId, itemId);
  if (!existing) return false;
  const rows = await db
    .delete(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .returning({ id: shoppingItems.id });
  return rows.length > 0;
}

export async function reorderItems(
  userId: string,
  tripId: string,
  items: ReorderItemsInput['items'],
): Promise<number> {
  const trip = await assertTripOwned(userId, tripId);
  if (!trip) return 0;
  if (items.length === 0) return 0;
  let updated = 0;
  await db.transaction(async (tx) => {
    for (const it of items) {
      const rows = await tx
        .update(shoppingItems)
        .set({ position: it.position })
        .where(and(eq(shoppingItems.id, it.id), eq(shoppingItems.tripId, tripId)))
        .returning({ id: shoppingItems.id });
      updated += rows.length;
    }
  });
  return updated;
}

export async function completeTrip(userId: string, tripId: string): Promise<ShoppingTrip | null> {
  const trip = await assertTripOwned(userId, tripId);
  if (!trip) return null;
  const now = new Date();
  const [row] = await db
    .update(shoppingTrips)
    .set({ isCurrent: false, completedAt: now, updatedAt: now })
    .where(eq(shoppingTrips.id, tripId))
    .returning();
  return row ?? null;
}

export async function repeatTrip(
  userId: string,
  sourceTripId: string,
): Promise<ShoppingTrip | null> {
  const source = await assertTripOwned(userId, sourceTripId);
  if (!source) return null;

  return await db.transaction(async (tx) => {
    const now = new Date();
    // Close any current trip first
    await tx
      .update(shoppingTrips)
      .set({ isCurrent: false, completedAt: now, updatedAt: now })
      .where(and(eq(shoppingTrips.userId, userId), eq(shoppingTrips.isCurrent, true)));

    // Create new trip carrying the source's name
    const newTripId = genId();
    const [newTrip] = await tx
      .insert(shoppingTrips)
      .values({
        id: newTripId,
        userId,
        name: source.name,
        isCurrent: true,
      })
      .returning();

    // Copy unfinished items, fresh positions
    const sourceItems = await tx
      .select()
      .from(shoppingItems)
      .where(and(eq(shoppingItems.tripId, sourceTripId), eq(shoppingItems.isDone, false)))
      .orderBy(shoppingItems.position);

    if (sourceItems.length > 0) {
      await tx.insert(shoppingItems).values(
        sourceItems.map((it, idx) => ({
          id: genId(),
          tripId: newTripId,
          name: it.name,
          quantity: it.quantity,
          position: idx,
        })),
      );
    }

    return newTrip;
  });
}
