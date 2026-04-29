import { describe, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, notificationsQueue } from '@letget/db/schema';
import {
  enqueueNotification,
  pickupDueNotifications,
  markSent,
  markFailed,
  deleteNotificationsByPayloadKey,
} from '../../src/lib/notifications/queue';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `nq-${id}@test.local`, role: 'user' });
  return id;
}

describe('enqueueNotification + pickupDueNotifications', () => {
  it('enqueues a notification and pickup returns it when due', async () => {
    const userId = await makeUser();
    const past = new Date(Date.now() - 60_000);
    const row = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'abc' },
      scheduledFor: past,
    });
    expect(row.id).toBeTruthy();

    const due = await pickupDueNotifications(100);
    expect(due.some((n) => n.id === row.id)).toBe(true);
  });

  it('does not pickup notifications scheduled in the future', async () => {
    const userId = await makeUser();
    const future = new Date(Date.now() + 60 * 60_000);
    const row = await enqueueNotification({
      userId,
      eventType: 'morning_digest',
      payload: {},
      scheduledFor: future,
    });

    const due = await pickupDueNotifications(100);
    expect(due.some((n) => n.id === row.id)).toBe(false);
  });
});

describe('markSent', () => {
  it('removes notification from pickup', async () => {
    const userId = await makeUser();
    const row = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'x' },
      scheduledFor: new Date(Date.now() - 1000),
    });
    await markSent(row.id);
    const due = await pickupDueNotifications(100);
    expect(due.some((n) => n.id === row.id)).toBe(false);
    const [fresh] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, row.id));
    expect(fresh.sentAt).not.toBeNull();
  });
});

describe('markFailed', () => {
  it('bumps attempts and pushes scheduledFor into the future', async () => {
    const userId = await makeUser();
    const original = new Date(Date.now() - 10_000);
    const row = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'y' },
      scheduledFor: original,
    });
    const beforeFail = Date.now();
    await markFailed(row.id, 'boom');
    const [fresh] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, row.id));
    expect(fresh.attempts).toBe(1);
    expect(fresh.lastError).toBe('boom');
    expect(fresh.scheduledFor.getTime()).toBeGreaterThan(beforeFail);
  });

  it('truncates lastError to 1000 chars', async () => {
    const userId = await makeUser();
    const row = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'z' },
      scheduledFor: new Date(Date.now() - 1000),
    });
    const huge = 'e'.repeat(5_000);
    await markFailed(row.id, huge);
    const [fresh] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, row.id));
    expect(fresh.lastError!.length).toBe(1000);
  });
});

describe('attempts >= 5 are excluded from pickup', () => {
  it('excludes rows that hit MAX_ATTEMPTS', async () => {
    const userId = await makeUser();
    const id = genId();
    await db.insert(notificationsQueue).values({
      id,
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'maxed' },
      scheduledFor: new Date(Date.now() - 1000),
      attempts: 5,
    });
    const due = await pickupDueNotifications(100);
    expect(due.some((n) => n.id === id)).toBe(false);
  });
});

describe('deleteNotificationsByPayloadKey', () => {
  it('removes only matching pending rows for the user', async () => {
    const userId = await makeUser();
    const otherUser = await makeUser();
    const target = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'T1' },
      scheduledFor: new Date(Date.now() + 60_000),
    });
    const sameUserDifferentTask = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'T2' },
      scheduledFor: new Date(Date.now() + 60_000),
    });
    const otherUserSameTaskId = await enqueueNotification({
      userId: otherUser,
      eventType: 'task_deadline',
      payload: { taskId: 'T1' },
      scheduledFor: new Date(Date.now() + 60_000),
    });
    const sameUserSentRow = await enqueueNotification({
      userId,
      eventType: 'task_deadline',
      payload: { taskId: 'T1' },
      scheduledFor: new Date(Date.now() + 60_000),
    });
    await markSent(sameUserSentRow.id);

    await deleteNotificationsByPayloadKey(userId, 'task_deadline', 'taskId', 'T1');

    const [t1] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, target.id));
    expect(t1).toBeUndefined();

    const [t2] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, sameUserDifferentTask.id));
    expect(t2).toBeDefined();

    const [other] = await db
      .select()
      .from(notificationsQueue)
      .where(eq(notificationsQueue.id, otherUserSameTaskId.id));
    expect(other).toBeDefined();

    // sent row stays untouched
    const [sent] = await db
      .select()
      .from(notificationsQueue)
      .where(
        and(eq(notificationsQueue.id, sameUserSentRow.id), eq(notificationsQueue.userId, userId)),
      );
    expect(sent).toBeDefined();
  });
});
