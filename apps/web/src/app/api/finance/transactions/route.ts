import { NextResponse } from 'next/server';

import { createTransactionSchema, listTransactionsQuerySchema } from '@letget/lib/zod/finance';

import { requireUser } from '@/lib/auth/session';
import { createTransaction } from '@/lib/finance/mutations';
import { listTransactions } from '@/lib/finance/queries';

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const parsed = listTransactionsQuerySchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    categoryId: url.searchParams.get('categoryId') ?? undefined,
    kind: url.searchParams.get('kind') ?? undefined,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const data = await listTransactions(user.id, parsed.data);
  return NextResponse.json({ transactions: data });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = createTransactionSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const row = await createTransaction(user.id, parsed.data);
    return NextResponse.json({ transaction: row }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
