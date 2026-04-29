import { and, asc, eq, isNull, lt, lte } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { notificationPrefs, notificationsQueue, telegramLinks } from '@letget/db/schema';
import type { EventType } from '@letget/lib/zod/notifications';

const { db } = createDbClient();

const MAX_ATTEMPTS = 5;

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

export async function getChatIdForUser(userId: string): Promise<bigint | null> {
  const rows = await db
    .select()
    .from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .limit(1);
  return rows[0]?.chatId ?? null;
}

export async function deleteLinkForUser(userId: string) {
  await db.delete(telegramLinks).where(eq(telegramLinks.userId, userId));
}

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

export async function listUsersWithEnabledPref(eventType: EventType) {
  return db
    .select({ userId: notificationPrefs.userId })
    .from(notificationPrefs)
    .where(and(eq(notificationPrefs.eventType, eventType), eq(notificationPrefs.enabled, true)));
}
