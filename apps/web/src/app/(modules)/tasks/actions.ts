'use server';

import { revalidatePath } from 'next/cache';

import { createTaskSchema, updateTaskSchema } from '@letget/lib/zod/tasks';

import { requireUser } from '@/lib/auth/session';
import { createTask, updateTask, softDeleteTask, bulkUpdate } from '@/lib/tasks/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createTaskAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await createTask(user.id, parsed.data);
  revalidatePath('/tasks');
  return { ok: true, data: { id: row.id } };
}

export async function updateTaskAction(taskId: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const updated = await updateTask(user.id, taskId, parsed.data);
  if (!updated) return { ok: false, error: 'Задача не найдена' };
  revalidatePath('/tasks');
  return { ok: true };
}

export async function toggleDoneAction(taskId: string): Promise<Result> {
  const user = await requireUser();
  const { getTask } = await import('@/lib/tasks/queries');
  const task = await getTask(user.id, taskId);
  if (!task) return { ok: false, error: 'Задача не найдена' };
  await updateTask(user.id, taskId, { isDone: !task.isDone });
  revalidatePath('/tasks');
  return { ok: true };
}

export async function togglePinAction(taskId: string): Promise<Result> {
  const user = await requireUser();
  const { getTask } = await import('@/lib/tasks/queries');
  const task = await getTask(user.id, taskId);
  if (!task) return { ok: false, error: 'Задача не найдена' };
  await updateTask(user.id, taskId, { isPinned: !task.isPinned });
  revalidatePath('/tasks');
  return { ok: true };
}

export async function deleteTaskAction(taskId: string): Promise<Result> {
  const user = await requireUser();
  const ok = await softDeleteTask(user.id, taskId);
  if (!ok) return { ok: false, error: 'Задача не найдена' };
  revalidatePath('/tasks');
  return { ok: true };
}

export async function bulkAction(
  ids: string[],
  action: 'done' | 'undone' | 'delete',
): Promise<Result<{ count: number }>> {
  const user = await requireUser();
  if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: 'Нет выбранных задач' };
  const count = await bulkUpdate(user.id, ids, action);
  revalidatePath('/tasks');
  return { ok: true, data: { count } };
}
