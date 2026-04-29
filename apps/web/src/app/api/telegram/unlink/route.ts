import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';

import { requireUser } from '@/lib/auth/session';

const { db } = createDbClient();

export async function POST() {
  const user = await requireUser();
  await db.delete(telegramLinks).where(eq(telegramLinks.userId, user.id));
  return NextResponse.json({ ok: true });
}
