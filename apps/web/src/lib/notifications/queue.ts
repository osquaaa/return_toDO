import { and, eq, isNull, lte, lt, asc, sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { notificationsQueue } from '@letget/db/schema';
import type { EventType } from '@letget/lib/zod/notifications';

const { db } = createDbClient();

const MAX_ATTEMPTS = 5;

type EnqueueArgs = {
  userId: string;
  eventType: EventType;
  payload: Record<string, unknown>;
  scheduledFor: Date;
};

export async function enqueueNotification(args: EnqueueArgs) {
  const [row] = await db
    .insert(notificationsQueue)
    .values({
      id: genId(),
      userId: args.userId,
      eventType: args.eventType,
      payload: args.payload,
      scheduledFor: args.scheduledFor,
    })
    .returning();
  return row;
}

export async function pickupDueNotifications(limit = 50) {
  return db
    .select()
    .from(notificationsQueue)
    .where(
      and(
        isNull(notificationsQueue.sentAt),
        lte(notificationsQueue.scheduledFor, new Date()),
        lt(notificationsQueue.attempts, MAX_ATTEMPTS),
      ),
    )
    .orderBy(asc(notificationsQueue.scheduledFor))
    .limit(limit);
}

export async function markSent(id: string) {
  await db
    .update(notificationsQueue)
    .set({ sentAt: new Date() })
    .where(eq(notificationsQueue.id, id));
}

export async function markFailed(id: string, error: string) {
  const [row] = await db
    .select()
    .from(notificationsQueue)
    .where(eq(notificationsQueue.id, id))
    .limit(1);
  if (!row) return;
  const nextAttempts = (row.attempts ?? 0) + 1;
  const backoffMs = 60_000 * nextAttempts;
  await db
    .update(notificationsQueue)
    .set({
      attempts: nextAttempts,
      lastError: error.slice(0, 1000),
      scheduledFor: new Date(Date.now() + backoffMs),
    })
    .where(eq(notificationsQueue.id, id));
}

export async function deleteNotificationsByPayloadKey(
  userId: string,
  eventType: EventType,
  key: string,
  value: string,
) {
  await db
    .delete(notificationsQueue)
    .where(
      and(
        eq(notificationsQueue.userId, userId),
        eq(notificationsQueue.eventType, eventType),
        isNull(notificationsQueue.sentAt),
        sql`${notificationsQueue.payload} ->> ${key} = ${value}`,
      ),
    );
}
