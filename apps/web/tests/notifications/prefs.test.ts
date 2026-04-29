import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, notificationPrefs } from '@letget/db/schema';
import {
  upsertNotificationPref,
  getPref,
  listNotificationPrefs,
} from '../../src/lib/notifications/prefs';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `np-${id}@test.local`, role: 'user' });
  return id;
}

describe('upsertNotificationPref', () => {
  it('inserts a new pref when none exists', async () => {
    const userId = await makeUser();
    const row = await upsertNotificationPref(userId, {
      eventType: 'morning_digest',
      enabled: true,
      timeOfDay: '08:30',
      minutesBefore: null,
    });
    expect(row.userId).toBe(userId);
    expect(row.eventType).toBe('morning_digest');
    expect(row.enabled).toBe(true);
    expect(row.timeOfDay).toBe('08:30:00');
  });

  it('updates instead of duplicating on second call with same eventType', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: true,
      minutesBefore: 30,
    });
    await upsertNotificationPref(userId, {
      eventType: 'task_deadline',
      enabled: false,
      minutesBefore: 60,
    });
    const all = await db
      .select()
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId));
    expect(all.length).toBe(1);
    expect(all[0].enabled).toBe(false);
    expect(all[0].minutesBefore).toBe(60);
  });

  it('multiple eventTypes coexist for one user', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, { eventType: 'morning_digest', enabled: true });
    await upsertNotificationPref(userId, { eventType: 'weekly_recap', enabled: true });
    const list = await listNotificationPrefs(userId);
    expect(list.length).toBe(2);
  });
});

describe('getPref', () => {
  it('returns null for absent eventType', async () => {
    const userId = await makeUser();
    const pref = await getPref(userId, 'workout_streak_warn');
    expect(pref).toBeNull();
  });

  it('returns the row when present', async () => {
    const userId = await makeUser();
    await upsertNotificationPref(userId, {
      eventType: 'custom_reminder',
      enabled: true,
      minutesBefore: 15,
    });
    const pref = await getPref(userId, 'custom_reminder');
    expect(pref).not.toBeNull();
    expect(pref!.minutesBefore).toBe(15);
  });
});
