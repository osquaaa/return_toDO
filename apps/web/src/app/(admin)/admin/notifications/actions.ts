'use server';

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { createDbClient } from '@letget/db/client';

import { logAdminAction } from '@/lib/admin/audit';
import { requireAdminContext } from '@/lib/admin/guard';

const { db } = createDbClient();

type Result = { ok: true } | { ok: false; error: string };

export async function retryNotificationAction(id: string): Promise<Result> {
  const ctx = await requireAdminContext();
  await logAdminAction({
    adminUserId: ctx.user.id,
    action: 'notification_retry',
    targetType: 'notification',
    targetId: id,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  await db.execute(
    sql`update notifications_queue set attempts = 0, last_error = null, scheduled_for = now() where id = ${id}`,
  );
  revalidatePath('/admin/notifications');
  return { ok: true };
}

export async function cancelNotificationAction(id: string): Promise<Result> {
  const ctx = await requireAdminContext();
  await logAdminAction({
    adminUserId: ctx.user.id,
    action: 'notification_cancel',
    targetType: 'notification',
    targetId: id,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  await db.execute(
    sql`update notifications_queue set sent_at = now(), last_error = 'cancelled by admin' where id = ${id}`,
  );
  revalidatePath('/admin/notifications');
  return { ok: true };
}
