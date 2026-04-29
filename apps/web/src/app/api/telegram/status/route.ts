import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';

import { requireUser } from '@/lib/auth/session';

const { db } = createDbClient();

export async function GET() {
  const user = await requireUser();
  const rows = await db.select().from(telegramLinks).where(eq(telegramLinks.userId, user.id));
  if (rows.length === 0) return NextResponse.json({ linked: false });
  return NextResponse.json({
    linked: true,
    username: rows[0].username,
    linkedAt: rows[0].linkedAt,
  });
}
