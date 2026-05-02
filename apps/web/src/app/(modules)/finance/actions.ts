'use server';

import { revalidatePath } from 'next/cache';

import {
  createCategorySchema,
  createTransactionSchema,
  updateCategorySchema,
  updateTransactionSchema,
} from '@letget/lib/zod/finance';

import { requireUser } from '@/lib/auth/session';
import {
  archiveCategory,
  createCategory,
  createTransaction,
  deleteTransaction,
  updateCategory,
  updateTransaction,
} from '@/lib/finance/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createCategoryAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await createCategory(user.id, parsed.data);
  revalidatePath('/finance');
  return { ok: true, data: { id: row.id } };
}

export async function updateCategoryAction(id: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const updated = await updateCategory(user.id, id, parsed.data);
  if (!updated) return { ok: false, error: 'Категория не найдена' };
  revalidatePath('/finance');
  return { ok: true };
}

export async function archiveCategoryAction(id: string): Promise<Result> {
  const user = await requireUser();
  const ok = await archiveCategory(user.id, id);
  if (!ok) return { ok: false, error: 'Категория не найдена' };
  revalidatePath('/finance');
  return { ok: true };
}

export async function createTransactionAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const row = await createTransaction(user.id, parsed.data);
    revalidatePath('/finance');
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Не удалось добавить' };
  }
}

export async function updateTransactionAction(id: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const updated = await updateTransaction(user.id, id, parsed.data);
    if (!updated) return { ok: false, error: 'Операция не найдена' };
    revalidatePath('/finance');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Не удалось сохранить' };
  }
}

export async function deleteTransactionAction(id: string): Promise<Result> {
  const user = await requireUser();
  const ok = await deleteTransaction(user.id, id);
  if (!ok) return { ok: false, error: 'Операция не найдена' };
  revalidatePath('/finance');
  return { ok: true };
}
