import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth/session';
import { issueLinkToken } from '@/lib/telegram/link';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'letget_bot';

export async function POST() {
  const user = await requireUser();
  const token = await issueLinkToken(user.id);
  return NextResponse.json({
    token,
    deepLink: `https://t.me/${BOT_USERNAME}?start=link_${token}`,
    expiresInSec: 600,
  });
}
