import { NextResponse } from 'next/server';

import { createCategorySchema, financeKindEnum } from '@letget/lib/zod/finance';

import { requireUser } from '@/lib/auth/session';
import { createCategory } from '@/lib/finance/mutations';
import { listCategories } from '@/lib/finance/queries';

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const kindRaw = url.searchParams.get('kind');
  const kindParsed = kindRaw ? financeKindEnum.safeParse(kindRaw) : null;
  const includeArchived = url.searchParams.get('includeArchived') === '1';
  const data = await listCategories(user.id, {
    kind: kindParsed?.success ? kindParsed.data : undefined,
    includeArchived,
  });
  return NextResponse.json({ categories: data });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = createCategorySchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await createCategory(user.id, parsed.data);
  return NextResponse.json({ category: row }, { status: 201 });
}
