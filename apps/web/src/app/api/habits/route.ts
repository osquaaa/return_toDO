import { NextResponse } from 'next/server';

import { createHabitSchema } from '@letget/lib/zod/habits';

import { requireUser } from '@/lib/auth/session';
import { createHabit } from '@/lib/habits/mutations';
import { listHabits } from '@/lib/habits/queries';

export async function GET() {
  const user = await requireUser();
  const data = await listHabits(user.id);
  return NextResponse.json({ habits: data });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = createHabitSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const row = await createHabit(user.id, parsed.data);
  return NextResponse.json({ habit: row }, { status: 201 });
}
