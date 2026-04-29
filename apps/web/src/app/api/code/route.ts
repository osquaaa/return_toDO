import { NextResponse } from 'next/server';

import { createSnippetSchema, listSnippetsQuerySchema } from '@letget/lib/zod/code';

import { requireUser } from '@/lib/auth/session';
import { listSnippets } from '@/lib/code/queries';
import { createSnippet } from '@/lib/code/mutations';

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const pinnedRaw = url.searchParams.get('pinned');
  const parsed = listSnippetsQuerySchema.safeParse({
    q: url.searchParams.get('q') ?? undefined,
    pinned: pinnedRaw === 'true' ? true : pinnedRaw === 'false' ? false : undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const data = await listSnippets(user.id, parsed.data);
  return NextResponse.json({ snippets: data });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = createSnippetSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await createSnippet(user.id, parsed.data);
  return NextResponse.json({ snippet: row }, { status: 201 });
}
