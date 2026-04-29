import { describe, it, expect } from 'vitest';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { users, tasks } from '@letget/db/schema';
import { listTasks, getTask } from '../../src/lib/tasks/queries';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db.insert(users).values({ id, email: `q-${id}@test.local`, role: 'user' });
  return id;
}

async function seed(userId: string) {
  await db.insert(tasks).values([
    {
      id: genId(),
      userId,
      contentHtml: '<p>купить молоко</p>',
      contentText: 'купить молоко',
      isDone: false,
      isPinned: true,
    },
    {
      id: genId(),
      userId,
      contentHtml: '<p>забрать посылку</p>',
      contentText: 'забрать посылку',
      isDone: false,
      isPinned: false,
    },
    {
      id: genId(),
      userId,
      contentHtml: '<p>отчёт по работе</p>',
      contentText: 'отчёт по работе',
      isDone: true,
      isPinned: false,
    },
  ]);
}

describe('listTasks', () => {
  it('returns active by default, pinned first', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listTasks(userId, { filter: 'active' });
    expect(rows.length).toBe(2);
    expect(rows[0].isPinned).toBe(true);
  });

  it('filter=done returns only completed', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listTasks(userId, { filter: 'done' });
    expect(rows.length).toBe(1);
    expect(rows[0].isDone).toBe(true);
  });

  it('search matches Russian word via tsvector', async () => {
    const userId = await makeUser();
    await seed(userId);
    const rows = await listTasks(userId, { filter: 'all', q: 'молоко' });
    expect(rows.length).toBe(1);
    expect(rows[0].contentText).toContain('молоко');
  });
});

describe('getTask', () => {
  it('returns task when owner matches', async () => {
    const userId = await makeUser();
    const taskId = genId();
    await db.insert(tasks).values({
      id: taskId,
      userId,
      contentHtml: '<p>solo</p>',
      contentText: 'solo',
    });
    const got = await getTask(userId, taskId);
    expect(got).not.toBeNull();
    expect(got?.id).toBe(taskId);
  });

  it('returns null when owner mismatches', async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const taskId = genId();
    await db.insert(tasks).values({
      id: taskId,
      userId: owner,
      contentHtml: '<p>private</p>',
      contentText: 'private',
    });
    const got = await getTask(intruder, taskId);
    expect(got).toBeNull();
  });
});
