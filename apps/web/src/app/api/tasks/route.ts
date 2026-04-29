import { NextResponse } from 'next/server';

import { createTaskSchema, listTasksQuerySchema } from '@letget/lib/zod/tasks';

import { requireUser } from '@/lib/auth/session';
import { listTasks } from '@/lib/tasks/queries';
import { createTask } from '@/lib/tasks/mutations';

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const parsed = listTasksQuerySchema.safeParse({
    filter: url.searchParams.get('filter') ?? 'active',
    q: url.searchParams.get('q') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const data = await listTasks(user.id, parsed.data);
  return NextResponse.json({ tasks: data });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = createTaskSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await createTask(user.id, parsed.data);
  return NextResponse.json({ task: row }, { status: 201 });
}
