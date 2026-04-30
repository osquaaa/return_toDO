'use server';

import { revalidatePath } from 'next/cache';

import { checkinSchema, createHabitSchema, updateHabitSchema } from '@letget/lib/zod/habits';

import { requireUser } from '@/lib/auth/session';
import {
  addCheckin,
  archiveHabit,
  createHabit,
  decrementCheckin,
  removeCheckin,
  updateHabit,
} from '@/lib/habits/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createHabitAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = createHabitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await createHabit(user.id, parsed.data);
  revalidatePath('/habits');
  return { ok: true, data: { id: row.id } };
}

export async function updateHabitAction(habitId: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateHabitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const updated = await updateHabit(user.id, habitId, parsed.data);
  if (!updated) return { ok: false, error: 'Привычка не найдена' };
  revalidatePath('/habits');
  return { ok: true };
}

export async function archiveHabitAction(habitId: string): Promise<Result> {
  const user = await requireUser();
  const ok = await archiveHabit(user.id, habitId);
  if (!ok) return { ok: false, error: 'Привычка не найдена' };
  revalidatePath('/habits');
  return { ok: true };
}

export async function checkinAction(input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const ok = await addCheckin(user.id, parsed.data);
  if (!ok) return { ok: false, error: 'Привычка не найдена' };
  revalidatePath('/habits');
  return { ok: true };
}

export async function decrementCheckinAction(
  habitId: string,
  performedOn: string,
): Promise<Result> {
  const user = await requireUser();
  const ok = await decrementCheckin(user.id, habitId, performedOn);
  if (!ok) return { ok: false, error: 'Отметка не найдена' };
  revalidatePath('/habits');
  return { ok: true };
}

export async function removeCheckinAction(habitId: string, performedOn: string): Promise<Result> {
  const user = await requireUser();
  const ok = await removeCheckin(user.id, habitId, performedOn);
  if (!ok) return { ok: false, error: 'Отметка не найдена' };
  revalidatePath('/habits');
  return { ok: true };
}
