import { NextResponse } from 'next/server';

import { addItemSchema } from '@letget/lib/zod/shopping';

import { requireUser } from '@/lib/auth/session';
import { getCurrentTrip } from '@/lib/shopping/queries';
import { addItem } from '@/lib/shopping/mutations';

export async function POST(req: Request) {
  const user = await requireUser();
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = addItemSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const trip = await getCurrentTrip(user.id);
  if (!trip) return NextResponse.json({ error: 'no_current_trip' }, { status: 409 });
  const row = await addItem(user.id, trip.id, parsed.data);
  if (!row) return NextResponse.json({ error: 'failed' }, { status: 500 });
  return NextResponse.json({ item: row }, { status: 201 });
}
