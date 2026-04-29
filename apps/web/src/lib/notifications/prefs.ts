import { and, eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { notificationPrefs } from '@letget/db/schema';
import type { SetNotificationPrefInput, EventType } from '@letget/lib/zod/notifications';

const { db } = createDbClient();

export async function listNotificationPrefs(userId: string) {
  return db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId));
}

export async function getPref(userId: string, eventType: EventType) {
  const rows = await db
    .select()
    .from(notificationPrefs)
    .where(and(eq(notificationPrefs.userId, userId), eq(notificationPrefs.eventType, eventType)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertNotificationPref(userId: string, input: SetNotificationPrefInput) {
  const existing = await getPref(userId, input.eventType);
  if (existing) {
    const [row] = await db
      .update(notificationPrefs)
      .set({
        enabled: input.enabled,
        timeOfDay: input.timeOfDay ?? null,
        minutesBefore: input.minutesBefore ?? null,
        updatedAt: new Date(),
      })
      .where(eq(notificationPrefs.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(notificationPrefs)
    .values({
      id: genId(),
      userId,
      eventType: input.eventType,
      enabled: input.enabled,
      timeOfDay: input.timeOfDay ?? null,
      minutesBefore: input.minutesBefore ?? null,
    })
    .returning();
  return row;
}
