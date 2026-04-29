import { and, eq, isNull } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { codeSnippets, type CodeSnippet } from '@letget/db/schema';
import type { CreateSnippetInput, UpdateSnippetInput } from '@letget/lib/zod/code';

const { db } = createDbClient();

export async function createSnippet(
  userId: string,
  input: CreateSnippetInput,
): Promise<CodeSnippet> {
  const [row] = await db
    .insert(codeSnippets)
    .values({
      id: genId(),
      userId,
      code: input.code,
      title: input.title ?? null,
      language: input.language ?? null,
    })
    .returning();
  return row;
}

export async function updateSnippet(
  userId: string,
  id: string,
  input: UpdateSnippetInput,
): Promise<CodeSnippet | null> {
  const patch: Partial<typeof codeSnippets.$inferInsert> = { updatedAt: new Date() };

  if (input.code !== undefined) patch.code = input.code;
  if (input.title !== undefined) patch.title = input.title;
  if (input.language !== undefined) patch.language = input.language;
  if (input.isPinned !== undefined) patch.isPinned = input.isPinned;

  const rows = await db
    .update(codeSnippets)
    .set(patch)
    .where(
      and(eq(codeSnippets.id, id), eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)),
    )
    .returning();
  return rows[0] ?? null;
}

export async function softDeleteSnippet(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(codeSnippets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(codeSnippets.id, id), eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)),
    )
    .returning({ id: codeSnippets.id });
  return rows.length > 0;
}

export async function togglePin(userId: string, id: string): Promise<boolean | null> {
  const rows = await db
    .select({ isPinned: codeSnippets.isPinned })
    .from(codeSnippets)
    .where(
      and(eq(codeSnippets.id, id), eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)),
    )
    .limit(1);
  if (rows.length === 0) return null;
  const next = !rows[0].isPinned;
  await db
    .update(codeSnippets)
    .set({ isPinned: next, updatedAt: new Date() })
    .where(
      and(eq(codeSnippets.id, id), eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)),
    );
  return next;
}
