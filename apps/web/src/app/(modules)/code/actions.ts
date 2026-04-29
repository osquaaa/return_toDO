'use server';

import { revalidatePath } from 'next/cache';

import { createSnippetSchema, updateSnippetSchema } from '@letget/lib/zod/code';

import { requireUser } from '@/lib/auth/session';
import { createSnippet, updateSnippet, softDeleteSnippet, togglePin } from '@/lib/code/mutations';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createSnippetAction(input: unknown): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = createSnippetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = await createSnippet(user.id, parsed.data);
  revalidatePath('/code');
  return { ok: true, data: { id: row.id } };
}

export async function updateSnippetAction(id: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = updateSnippetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const updated = await updateSnippet(user.id, id, parsed.data);
  if (!updated) return { ok: false, error: 'Сниппет не найден' };
  revalidatePath('/code');
  return { ok: true };
}

export async function togglePinAction(id: string): Promise<Result> {
  const user = await requireUser();
  const next = await togglePin(user.id, id);
  if (next === null) return { ok: false, error: 'Сниппет не найден' };
  revalidatePath('/code');
  return { ok: true };
}

export async function deleteSnippetAction(id: string): Promise<Result> {
  const user = await requireUser();
  const ok = await softDeleteSnippet(user.id, id);
  if (!ok) return { ok: false, error: 'Сниппет не найден' };
  revalidatePath('/code');
  return { ok: true };
}
