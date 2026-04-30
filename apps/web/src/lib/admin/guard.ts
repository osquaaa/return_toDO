import { headers } from 'next/headers';

import { requireAdmin } from '@/lib/auth/session';

export async function requireAdminContext() {
  const user = await requireAdmin();
  const hdrs = await headers();
  const ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
  const userAgent = hdrs.get('user-agent') ?? null;
  return { user, ipAddress, userAgent };
}
