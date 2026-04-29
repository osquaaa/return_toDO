import { and, eq, inArray, isNull } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { tasks, type Task } from '@letget/db/schema';
import type { CreateTaskInput, UpdateTaskInput } from '@letget/lib/zod/tasks';

import { sanitizeHtml, htmlToPlainText } from '../sanitize';

const { db } = createDbClient();

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const html = sanitizeHtml(input.contentHtml);
  const text = htmlToPlainText(html);
  const [row] = await db
    .insert(tasks)
    .values({
      id: genId(),
      userId,
      contentHtml: html,
      contentText: text,
      isPinned: input.isPinned,
      deadline: input.deadline ? new Date(input.deadline) : null,
    })
    .returning();
  return row;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  const patch: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };

  if (input.contentHtml !== undefined) {
    const html = sanitizeHtml(input.contentHtml);
    patch.contentHtml = html;
    patch.contentText = htmlToPlainText(html);
  }
  if (input.isPinned !== undefined) patch.isPinned = input.isPinned;
  if (input.deadline !== undefined) {
    patch.deadline = input.deadline ? new Date(input.deadline) : null;
  }
  if (input.isDone !== undefined) {
    patch.isDone = input.isDone;
    patch.doneAt = input.isDone ? new Date() : null;
  }

  const rows = await db
    .update(tasks)
    .set(patch)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning();
  return rows[0] ?? null;
}

export async function softDeleteTask(userId: string, taskId: string): Promise<boolean> {
  const rows = await db
    .update(tasks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id });
  return rows.length > 0;
}

export async function bulkUpdate(
  userId: string,
  ids: string[],
  action: 'done' | 'undone' | 'delete',
): Promise<number> {
  if (ids.length === 0) return 0;
  const conds = and(eq(tasks.userId, userId), inArray(tasks.id, ids), isNull(tasks.deletedAt));
  if (action === 'delete') {
    const rows = await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(conds)
      .returning({ id: tasks.id });
    return rows.length;
  }
  const isDone = action === 'done';
  const rows = await db
    .update(tasks)
    .set({ isDone, doneAt: isDone ? new Date() : null, updatedAt: new Date() })
    .where(conds)
    .returning({ id: tasks.id });
  return rows.length;
}
