import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import {
  shoppingItems,
  shoppingTrips,
  type ShoppingItem,
  type ShoppingTrip,
} from '@letget/db/schema';

const { db } = createDbClient();

export async function getCurrentTrip(userId: string): Promise<ShoppingTrip | null> {
  const rows = await db
    .select()
    .from(shoppingTrips)
    .where(and(eq(shoppingTrips.userId, userId), eq(shoppingTrips.isCurrent, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTripsHistory(userId: string, limit = 20): Promise<ShoppingTrip[]> {
  return await db
    .select()
    .from(shoppingTrips)
    .where(and(eq(shoppingTrips.userId, userId), isNotNull(shoppingTrips.completedAt)))
    .orderBy(desc(shoppingTrips.completedAt))
    .limit(limit);
}

export async function listItems(tripId: string): Promise<ShoppingItem[]> {
  return await db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.tripId, tripId))
    .orderBy(asc(shoppingItems.position));
}

export async function listItemSuggestions(userId: string, limit = 20): Promise<string[]> {
  const rows = await db
    .select({ name: shoppingItems.name })
    .from(shoppingItems)
    .innerJoin(shoppingTrips, eq(shoppingItems.tripId, shoppingTrips.id))
    .where(eq(shoppingTrips.userId, userId))
    .groupBy(shoppingItems.name)
    .orderBy(desc(sql`max(${shoppingItems.createdAt})`))
    .limit(limit);
  return rows.map((r) => r.name);
}

export async function countItemsByTrip(
  tripIds: string[],
): Promise<Map<string, { total: number; done: number }>> {
  const map = new Map<string, { total: number; done: number }>();
  if (tripIds.length === 0) return map;
  const rows = await db
    .select({
      tripId: shoppingItems.tripId,
      total: sql<number>`count(*)::int`,
      done: sql<number>`sum(case when ${shoppingItems.isDone} then 1 else 0 end)::int`,
    })
    .from(shoppingItems)
    .where(inArray(shoppingItems.tripId, tripIds))
    .groupBy(shoppingItems.tripId);
  for (const r of rows) map.set(r.tripId, { total: r.total, done: r.done });
  return map;
}
