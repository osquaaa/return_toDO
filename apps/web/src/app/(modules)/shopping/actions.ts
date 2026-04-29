'use server';

import { revalidatePath } from 'next/cache';

import {
  addItemSchema,
  reorderItemsSchema,
  startTripSchema,
  updateItemSchema,
} from '@letget/lib/zod/shopping';

import { requireUser } from '@/lib/auth/session';
import { getCurrentTrip } from '@/lib/shopping/queries';
import {
  addItem,
  completeTrip,
  deleteItem,
  reorderItems,
  repeatTrip,
  startNewTrip,
  toggleItem,
  updateItem,
} from '@/lib/shopping/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function startNewTripAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = startTripSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const trip = await startNewTrip(user.id, parsed.data.name);
  revalidatePath('/shopping');
  return { ok: true, data: { id: trip.id } };
}

export async function addItemAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const trip = await getCurrentTrip(user.id);
  if (!trip) return { ok: false, error: 'Нет активного похода' };
  const row = await addItem(user.id, trip.id, parsed.data);
  if (!row) return { ok: false, error: 'Не удалось добавить' };
  revalidatePath('/shopping');
  return { ok: true, data: { id: row.id } };
}

export async function toggleItemAction(itemId: string): Promise<Result> {
  const user = await requireUser();
  const row = await toggleItem(user.id, itemId);
  if (!row) return { ok: false, error: 'Позиция не найдена' };
  revalidatePath('/shopping');
  return { ok: true };
}

export async function updateItemAction(itemId: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await updateItem(user.id, itemId, parsed.data);
  if (!row) return { ok: false, error: 'Позиция не найдена' };
  revalidatePath('/shopping');
  return { ok: true };
}

export async function deleteItemAction(itemId: string): Promise<Result> {
  const user = await requireUser();
  const ok = await deleteItem(user.id, itemId);
  if (!ok) return { ok: false, error: 'Позиция не найдена' };
  revalidatePath('/shopping');
  return { ok: true };
}

export async function reorderItemsAction(tripId: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = reorderItemsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await reorderItems(user.id, tripId, parsed.data.items);
  revalidatePath('/shopping');
  return { ok: true };
}

export async function completeTripAction(tripId: string): Promise<Result> {
  const user = await requireUser();
  const row = await completeTrip(user.id, tripId);
  if (!row) return { ok: false, error: 'Поход не найден' };
  revalidatePath('/shopping');
  return { ok: true };
}

export async function repeatTripAction(tripId: string): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const trip = await repeatTrip(user.id, tripId);
  if (!trip) return { ok: false, error: 'Поход не найден' };
  revalidatePath('/shopping');
  return { ok: true, data: { id: trip.id } };
}
