import { describe, it, expect } from 'vitest';
import { and, eq, isNull } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, notificationsQueue } from '@letget/db/schema';
import { createTask, updateTask } from '../../src/lib/tasks/mutations';
import { upsertNotificationPref } from '../../src/lib/notifications/prefs';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `sch-${id}@test.local`, role: 'user' });
  return id;
}

async function listPendingDeadline(userId: string, taskId: string) {
  const rows = await db
    .select()
    .from(notificationsQueue)
    .where(
      and(
        eq(notificationsQueue.userId, userId),
        eq(notificationsQueue.eventType, 'task_deadline'),
        isNull(notificationsQueue.sentAt),
      ),
    );
  return rows.filter((r) => (r.payload as { taskId?: string }).taskId === taskId);
}

describe('scheduleTaskDeadlineNotification (via task mutations)', () => {
  it('createTask with deadline + pref enabled enqueues one row at deadline-minutesBefore', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: true,
      minutesBefore: 30,
    });
    const deadline = new Date(Date.now() + 60 * 60_000);
    const task = await createTask(userId, {
      contentHtml: '<p>buy milk</p>',
      isPinned: false,
      deadline: deadline.toISOString(),
    });
    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(1);
    const expectedFor = deadline.getTime() - 30 * 60_000;
    expect(Math.abs(pending[0].scheduledFor.getTime() - expectedFor)).toBeLessThan(2000);
    expect((pending[0].payload as { summary?: string }).summary).toContain('buy milk');
  });

  it('createTask without deadline does not enqueue', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, { eventType: 'task_deadline', enabled: true });
    const task = await createTask(userId, {
      contentHtml: '<p>no deadline</p>',
      isPinned: false,
      deadline: null,
    });
    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(0);
  });

  it('createTask without pref does not enqueue', async () => {
    const userId = await makeUser();
    const task = await createTask(userId, {
      contentHtml: '<p>no pref</p>',
      isPinned: false,
      deadline: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(0);
  });

  it('createTask with disabled pref does not enqueue', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: false,
      minutesBefore: 30,
    });
    const task = await createTask(userId, {
      contentHtml: '<p>disabled</p>',
      isPinned: false,
      deadline: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(0);
  });

  it('updateTask removing deadline cancels pending notification', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: true,
      minutesBefore: 30,
    });
    const task = await createTask(userId, {
      contentHtml: '<p>will lose deadline</p>',
      isPinned: false,
      deadline: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    expect((await listPendingDeadline(userId, task.id)).length).toBe(1);

    await updateTask(userId, task.id, { deadline: null });
    expect((await listPendingDeadline(userId, task.id)).length).toBe(0);
  });

  it('updateTask changing deadline reschedules to new time', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: true,
      minutesBefore: 30,
    });
    const initial = new Date(Date.now() + 60 * 60_000);
    const task = await createTask(userId, {
      contentHtml: '<p>shifty</p>',
      isPinned: false,
      deadline: initial.toISOString(),
    });

    const newDeadline = new Date(Date.now() + 4 * 60 * 60_000);
    await updateTask(userId, task.id, { deadline: newDeadline.toISOString() });

    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(1);
    const expected = newDeadline.getTime() - 30 * 60_000;
    expect(Math.abs(pending[0].scheduledFor.getTime() - expected)).toBeLessThan(2000);
  });

  it('createTask with deadline already inside the minutesBefore window does not enqueue', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: true,
      minutesBefore: 30,
    });
    const deadline = new Date(Date.now() + 5 * 60_000);
    const task = await createTask(userId, {
      contentHtml: '<p>too soon</p>',
      isPinned: false,
      deadline: deadline.toISOString(),
    });
    const pending = await listPendingDeadline(userId, task.id);
    expect(pending.length).toBe(0);
  });
});
