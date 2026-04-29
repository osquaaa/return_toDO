import { NextResponse } from 'next/server';

import { updateSnippetSchema } from '@letget/lib/zod/code';

import { requireUser } from '@/lib/auth/session';
import { updateSnippet, softDeleteSnippet } from '@/lib/code/mutations';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = updateSnippetSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await updateSnippet(user.id, id, parsed.data);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ snippet: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const ok = await softDeleteSnippet(user.id, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
