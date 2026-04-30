import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type AdminLoginRow = {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  attemptedAt: Date;
  suspicious: boolean;
};

export async function listLoginHistory(opts: {
  search?: string;
  successOnly?: boolean;
  failedOnly?: boolean;
  page: number;
  limit: number;
}): Promise<{ rows: AdminLoginRow[]; total: number; page: number; limit: number }> {
  const offset = (opts.page - 1) * opts.limit;
  const search = opts.search?.trim() ?? '';

  const filters: ReturnType<typeof sql>[] = [];
  if (search)
    filters.push(sql`(h.email ilike ${`%${search}%`} or h.ip_address ilike ${`%${search}%`})`);
  if (opts.successOnly) filters.push(sql`h.success = true`);
  if (opts.failedOnly) filters.push(sql`h.success = false`);

  let whereClause = sql``;
  if (filters.length > 0) {
    let combined = filters[0];
    for (let i = 1; i < filters.length; i++) {
      combined = sql`${combined} and ${filters[i]}`;
    }
    whereClause = sql`where ${combined}`;
  }

  const rows = (await db.execute<AdminLoginRow>(sql`
    select h.id, h.user_id as "userId", h.email, h.success,
      h.failure_reason as "failureReason", h.ip_address as "ipAddress",
      h.user_agent as "userAgent", h.attempted_at as "attemptedAt",
      coalesce((
        select count(*) >= 5
        from login_history h2
        where h2.ip_address = h.ip_address
          and h2.ip_address is not null
          and h2.success = false
          and h2.attempted_at between h.attempted_at - interval '1 hour' and h.attempted_at
      ), false) as suspicious
    from login_history h
    ${whereClause}
    order by h.attempted_at desc
    limit ${opts.limit} offset ${offset}
  `)) as unknown as AdminLoginRow[];

  const totalRows = (await db.execute<{ total: number }>(
    sql`select count(*)::int as total from login_history h ${whereClause}`,
  )) as unknown as { total: number }[];

  return {
    rows,
    total: totalRows[0]?.total ?? 0,
    page: opts.page,
    limit: opts.limit,
  };
}
