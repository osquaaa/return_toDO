import { and, asc, eq, gte, isNull, lt, or } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { tasks, type Task } from '@letget/db/schema';

const { db } = createDbClient();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
}

export async function listTodayTasks(userId: string): Promise<Task[]> {
  const now = new Date();
  const dayEnd = endOfDay(now);

  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isDone, false),
        isNull(tasks.deletedAt),
        or(
          eq(tasks.isPinned, true),
          and(gte(tasks.deadline, startOfDay(now)), lt(tasks.deadline, dayEnd)),
        ),
      ),
    )
    .orderBy(asc(tasks.deadline), asc(tasks.createdAt))
    .limit(50);
  return rows;
}

export async function createTaskFromBot(userId: string, text: string): Promise<Task> {
  const trimmed = text.trim().slice(0, 4000);
  const html = `<p>${escapeHtml(trimmed)}</p>`;
  const rows = await db
    .insert(tasks)
    .values({
      id: genId(),
      userId,
      contentHtml: html,
      contentText: trimmed,
      isPinned: false,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('insert failed');
  return row;
}

export async function markTaskDone(userId: string, taskId: string): Promise<boolean> {
  const rows = await db
    .update(tasks)
    .set({ isDone: true, doneAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id });
  return rows.length > 0;
}
