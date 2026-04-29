import { sql, and, eq, isNull, desc } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { codeSnippets, type CodeSnippet } from '@letget/db/schema';

const { db } = createDbClient();

type ListOpts = { q?: string; pinned?: boolean };

export async function listSnippets(userId: string, opts: ListOpts = {}): Promise<CodeSnippet[]> {
  const conds = [eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)];
  if (opts.pinned === true) conds.push(eq(codeSnippets.isPinned, true));
  if (opts.q && opts.q.trim().length > 0) {
    conds.push(sql`${codeSnippets.searchVector} @@ websearch_to_tsquery('russian', ${opts.q})`);
  }
  return await db
    .select()
    .from(codeSnippets)
    .where(and(...conds))
    .orderBy(desc(codeSnippets.isPinned), desc(codeSnippets.createdAt));
}

export async function getSnippet(userId: string, id: string): Promise<CodeSnippet | null> {
  const rows = await db
    .select()
    .from(codeSnippets)
    .where(
      and(eq(codeSnippets.id, id), eq(codeSnippets.userId, userId), isNull(codeSnippets.deletedAt)),
    )
    .limit(1);
  return rows[0] ?? null;
}
