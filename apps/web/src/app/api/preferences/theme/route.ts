import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { userPreferences } from '@letget/db/schema';

import { requireUser } from '@/lib/auth/session';

const { db } = createDbClient();

const schema = z.object({ theme: z.enum(['light', 'dark', 'system']) });

export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await db
    .update(userPreferences)
    .set({ theme: parsed.data.theme, updatedAt: new Date() })
    .where(eq(userPreferences.userId, user.id));
  return NextResponse.json({ ok: true });
}
