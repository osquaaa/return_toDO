import { NextResponse } from 'next/server';

import { updateTaskSchema } from '@letget/lib/zod/tasks';

import { requireUser } from '@/lib/auth/session';
import { updateTask, softDeleteTask } from '@/lib/tasks/mutations';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = updateTaskSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await updateTask(user.id, id, parsed.data);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ task: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const ok = await softDeleteTask(user.id, id);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
