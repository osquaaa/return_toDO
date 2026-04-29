import { NextResponse } from 'next/server';

import { v1MigrationSchema } from '@letget/lib/zod/migrate';

import { requireUser } from '@/lib/auth/session';
import { importV1 } from '@/lib/migrate/v1';
import { checkLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const user = await requireUser();

  const limit = await checkLimit({ key: `migrate:${user.id}`, max: 1, windowSec: 3600 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = v1MigrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await importV1(user.id, parsed.data);
  return NextResponse.json(result);
}
