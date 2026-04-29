import { sql, and, eq, isNull, desc } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { tasks, type Task } from '@letget/db/schema';

const { db } = createDbClient();

type ListOpts = { filter: 'all' | 'active' | 'done'; q?: string };

export async function listTasks(userId: string, opts: ListOpts): Promise<Task[]> {
  const baseConds = [eq(tasks.userId, userId), isNull(tasks.deletedAt)];
  if (opts.filter === 'active') baseConds.push(eq(tasks.isDone, false));
  if (opts.filter === 'done') baseConds.push(eq(tasks.isDone, true));
  if (opts.q && opts.q.trim().length > 0) {
    baseConds.push(sql`${tasks.searchVector} @@ websearch_to_tsquery('russian', ${opts.q})`);
  }
  return await db
    .select()
    .from(tasks)
    .where(and(...baseConds))
    .orderBy(desc(tasks.isPinned), sql`${tasks.deadline} ASC NULLS LAST`, desc(tasks.createdAt));
}

export async function getTask(userId: string, taskId: string): Promise<Task | null> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}
