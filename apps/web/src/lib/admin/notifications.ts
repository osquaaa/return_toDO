import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type NotificationsTab = 'pending' | 'sent' | 'failed';

export type AdminNotificationRow = {
  id: string;
  userId: string;
  email: string;
  eventType: string;
  payload: Record<string, unknown>;
  scheduledFor: Date;
  sentAt: Date | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
};

export async function listNotifications(tab: NotificationsTab, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const where =
    tab === 'pending'
      ? sql`where n.sent_at is null and n.attempts < 5`
      : tab === 'sent'
        ? sql`where n.sent_at is not null`
        : sql`where n.sent_at is null and n.attempts >= 5`;

  const rows = (await db.execute<AdminNotificationRow>(sql`
    select n.id, n.user_id as "userId", u.email, n.event_type as "eventType",
      n.payload, n.scheduled_for as "scheduledFor", n.sent_at as "sentAt",
      n.attempts, n.last_error as "lastError", n.created_at as "createdAt"
    from notifications_queue n
    join users u on u.id = n.user_id
    ${where}
    order by n.scheduled_for desc
    limit ${limit} offset ${offset}
  `)) as unknown as AdminNotificationRow[];

  const totalRows = (await db.execute<{ total: number }>(
    sql`select count(*)::int as total from notifications_queue n ${where}`,
  )) as unknown as { total: number }[];

  return { rows, total: totalRows[0]?.total ?? 0, tab, page, limit };
}
