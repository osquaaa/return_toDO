'use server';

import { revalidatePath } from 'next/cache';

import { addExerciseSchema, addSetSchema } from '@letget/lib/zod/workouts';

import { requireUser } from '@/lib/auth/session';
import {
  addExercise,
  archiveExercise,
  addSet,
  removeSet,
  clearTodaySets,
} from '@/lib/workouts/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function addExerciseAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = addExerciseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await addExercise(user.id, parsed.data);
  revalidatePath('/workouts');
  return { ok: true, data: { id: row.id } };
}

export async function archiveExerciseAction(id: string): Promise<Result> {
  const user = await requireUser();
  const ok = await archiveExercise(user.id, id);
  if (!ok) return { ok: false, error: 'Упражнение не найдено' };
  revalidatePath('/workouts');
  return { ok: true };
}

export async function addSetAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = addSetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await addSet(user.id, parsed.data);
  if (!row) return { ok: false, error: 'Упражнение не найдено' };
  revalidatePath('/workouts');
  return { ok: true, data: { id: row.id } };
}

export async function removeSetAction(id: string): Promise<Result> {
  const user = await requireUser();
  const ok = await removeSet(user.id, id);
  if (!ok) return { ok: false, error: 'Подход не найден' };
  revalidatePath('/workouts');
  return { ok: true };
}

export async function clearTodayAction(exerciseId?: string): Promise<Result<{ removed: number }>> {
  const user = await requireUser();
  const removed = await clearTodaySets(user.id, exerciseId);
  revalidatePath('/workouts');
  return { ok: true, data: { removed } };
}
