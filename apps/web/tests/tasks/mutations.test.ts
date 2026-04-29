import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, tasks } from '@letget/db/schema';
import { createTask, updateTask, softDeleteTask, bulkUpdate } from '../../src/lib/tasks/mutations';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `m-${id}@test.local`, role: 'user' });
  return id;
}

describe('createTask', () => {
  it('sanitizes HTML and derives contentText', async () => {
    const userId = await makeUser();
    const row = await createTask(userId, {
      contentHtml: '<p>привет<script>alert(1)</script></p>',
      isPinned: false,
      deadline: null,
    });
    expect(row.contentHtml).not.toContain('script');
    expect(row.contentHtml).not.toContain('alert');
    expect(row.contentText).toContain('привет');
    expect(row.contentText).not.toContain('<');
  });

  it('persists deadline when provided', async () => {
    const userId = await makeUser();
    const row = await createTask(userId, {
      contentHtml: '<p>есть дедлайн</p>',
      isPinned: true,
      deadline: '2026-12-31T23:59:59.000Z',
    });
    expect(row.deadline).not.toBeNull();
    expect(row.isPinned).toBe(true);
  });
});

describe('updateTask', () => {
  it('enforces ownership — other user cannot update', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const created = await createTask(owner, {
      contentHtml: '<p>secret</p>',
      isPinned: false,
      deadline: null,
    });
    const result = await updateTask(intruder, created.id, { contentHtml: '<p>hacked</p>' });
    expect(result).toBeNull();
    const fresh = await db.select().from(tasks).where(eq(tasks.id, created.id));
    expect(fresh[0].contentHtml).toContain('secret');
  });

  it('isDone toggle sets and clears doneAt', async () => {
    const userId = await makeUser();
    const created = await createTask(userId, {
      contentHtml: '<p>toggle me</p>',
      isPinned: false,
      deadline: null,
    });
    const done = await updateTask(userId, created.id, { isDone: true });
    expect(done).not.toBeNull();
    expect(done!.isDone).toBe(true);
    expect(done!.doneAt).not.toBeNull();

    const undone = await updateTask(userId, created.id, { isDone: false });
    expect(undone).not.toBeNull();
    expect(undone!.isDone).toBe(false);
    expect(undone!.doneAt).toBeNull();
  });
});

describe('softDeleteTask', () => {
  it('returns false when task is not owned', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const created = await createTask(owner, {
      contentHtml: '<p>mine</p>',
      isPinned: false,
      deadline: null,
    });
    const ok = await softDeleteTask(intruder, created.id);
    expect(ok).toBe(false);
    const fresh = await db.select().from(tasks).where(eq(tasks.id, created.id));
    expect(fresh[0].deletedAt).toBeNull();
  });

  it('returns true on success and stamps deletedAt', async () => {
    const userId = await makeUser();
    const created = await createTask(userId, {
      contentHtml: '<p>bye</p>',
      isPinned: false,
      deadline: null,
    });
    const ok = await softDeleteTask(userId, created.id);
    expect(ok).toBe(true);
    const fresh = await db.select().from(tasks).where(eq(tasks.id, created.id));
    expect(fresh[0].deletedAt).not.toBeNull();
  });
});

describe('bulkUpdate', () => {
  it('filters to userId and returns affected count', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const a = await createTask(owner, {
      contentHtml: '<p>a</p>',
      isPinned: false,
      deadline: null,
    });
    const b = await createTask(owner, {
      contentHtml: '<p>b</p>',
      isPinned: false,
      deadline: null,
    });
    const c = await createTask(intruder, {
      contentHtml: '<p>c</p>',
      isPinned: false,
      deadline: null,
    });

    const affected = await bulkUpdate(owner, [a.id, b.id, c.id], 'done');
    expect(affected).toBe(2);
    const cFresh = await db.select().from(tasks).where(eq(tasks.id, c.id));
    expect(cFresh[0].isDone).toBe(false);
  });

  it('returns 0 on empty ids', async () => {
    const userId = await makeUser();
    const affected = await bulkUpdate(userId, [], 'done');
    expect(affected).toBe(0);
  });

  it('action=delete soft-deletes only owned tasks', async () => {
    const userId = await makeUser();
    const t = await createTask(userId, {
      contentHtml: '<p>nuke</p>',
      isPinned: false,
      deadline: null,
    });
    const affected = await bulkUpdate(userId, [t.id], 'delete');
    expect(affected).toBe(1);
    const fresh = await db.select().from(tasks).where(eq(tasks.id, t.id));
    expect(fresh[0].deletedAt).not.toBeNull();
  });
});
