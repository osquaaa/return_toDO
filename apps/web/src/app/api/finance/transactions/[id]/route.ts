import { NextResponse } from 'next/server';

import { updateTransactionSchema } from '@letget/lib/zod/finance';

import { requireUser } from '@/lib/auth/session';
import { deleteTransaction, updateTransaction } from '@/lib/finance/mutations';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = updateTransactionSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const row = await updateTransaction(user.id, id, parsed.data);
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ transaction: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const ok = await deleteTransaction(user.id, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
