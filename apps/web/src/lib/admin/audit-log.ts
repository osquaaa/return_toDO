import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type AuditRow = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
};

export async function listAuditLog(opts: {
  search?: string;
  action?: string;
  page: number;
  limit: number;
}): Promise<{ rows: AuditRow[]; total: number; page: number; limit: number }> {
  const offset = (opts.page - 1) * opts.limit;
  const search = opts.search?.trim() ?? '';
  const actionFilter = opts.action?.trim() ?? '';

  const filters: ReturnType<typeof sql>[] = [];
  if (search) filters.push(sql`u.email ilike ${`%${search}%`}`);
  if (actionFilter) filters.push(sql`a.action = ${actionFilter}`);

  let whereClause = sql``;
  if (filters.length > 0) {
    let combined = filters[0];
    for (let i = 1; i < filters.length; i++) {
      combined = sql`${combined} and ${filters[i]}`;
    }
    whereClause = sql`where ${combined}`;
  }

  const rows = (await db.execute<AuditRow>(sql`
    select a.id, u.email as "adminEmail", a.action, a.target_type as "targetType",
      a.target_id as "targetId", a.metadata, a.ip_address as "ipAddress",
      a.created_at as "createdAt"
    from admin_audit_log a
    join users u on u.id = a.admin_user_id
    ${whereClause}
    order by a.created_at desc
    limit ${opts.limit} offset ${offset}
  `)) as unknown as AuditRow[];

  const totalRows = (await db.execute<{ total: number }>(sql`
    select count(*)::int as total
    from admin_audit_log a
    join users u on u.id = a.admin_user_id
    ${whereClause}
  `)) as unknown as { total: number }[];

  return {
    rows,
    total: totalRows[0]?.total ?? 0,
    page: opts.page,
    limit: opts.limit,
  };
}

export async function listAuditActions(): Promise<string[]> {
  const rows = (await db.execute<{ action: string }>(
    sql`select distinct action from admin_audit_log order by action asc limit 100`,
  )) as unknown as { action: string }[];
  return rows.map((r) => r.action);
}
