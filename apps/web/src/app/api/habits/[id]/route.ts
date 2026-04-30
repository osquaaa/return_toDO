import { NextResponse } from 'next/server';

import { updateHabitSchema } from '@letget/lib/zod/habits';

import { requireUser } from '@/lib/auth/session';
import { archiveHabit, updateHabit } from '@/lib/habits/mutations';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = updateHabitSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await updateHabit(user.id, id, parsed.data);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ habit: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const ok = await archiveHabit(user.id, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
