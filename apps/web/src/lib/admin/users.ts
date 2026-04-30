import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  telegramLinked: boolean;
  tasksCount: number;
  shoppingItemsCount: number;
  codeSnippetsCount: number;
  workoutSetsCount: number;
};

export async function listAdminUsers(opts: {
  search?: string;
  page: number;
  limit: number;
}): Promise<{ rows: AdminUserRow[]; total: number; page: number; limit: number }> {
  const offset = (opts.page - 1) * opts.limit;
  const search = opts.search?.trim() ?? '';
  const searchClause = search ? sql`where u.email ilike ${`%${search}%`}` : sql``;

  const rows = (await db.execute<AdminUserRow>(sql`
    select
      u.id, u.email, u.name, u.role, u.created_at as "createdAt",
      (select max(attempted_at) from login_history where user_id = u.id and success = true) as "lastLoginAt",
      exists(select 1 from telegram_links where user_id = u.id) as "telegramLinked",
      (select count(*)::int from tasks where user_id = u.id and deleted_at is null) as "tasksCount",
      (select count(*)::int from shopping_items i join shopping_trips t on i.trip_id = t.id where t.user_id = u.id) as "shoppingItemsCount",
      (select count(*)::int from code_snippets where user_id = u.id and deleted_at is null) as "codeSnippetsCount",
      (select count(*)::int from workout_sets where user_id = u.id) as "workoutSetsCount"
    from users u
    ${searchClause}
    order by u.created_at desc
    limit ${opts.limit} offset ${offset}
  `)) as unknown as AdminUserRow[];

  const totalRows = (await db.execute<{ total: number }>(
    sql`select count(*)::int as total from users u ${searchClause}`,
  )) as unknown as { total: number }[];

  return {
    rows,
    total: totalRows[0]?.total ?? 0,
    page: opts.page,
    limit: opts.limit,
  };
}

export type AdminUserDetail = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    emailVerified: Date | null;
  };
  counts: { key: string; count: number }[];
  telegram: { telegramId: bigint | null; username: string | null; linkedAt: Date | null } | null;
};

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail | null> {
  const userRows = (await db.execute<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    emailVerified: Date | null;
  }>(
    sql`select id, email, name, role, created_at as "createdAt", email_verified as "emailVerified" from users where id = ${id}`,
  )) as unknown as AdminUserDetail['user'][];
  const user = userRows[0];
  if (!user) return null;

  const counts = (await db.execute<{ key: string; count: number }>(sql`
    select 'tasks' as key, count(*)::int as count from tasks where user_id = ${id} and deleted_at is null
    union all
    select 'shopping_items', count(*)::int from shopping_items i join shopping_trips t on i.trip_id = t.id where t.user_id = ${id}
    union all
    select 'code_snippets', count(*)::int from code_snippets where user_id = ${id} and deleted_at is null
    union all
    select 'workout_sets', count(*)::int from workout_sets where user_id = ${id}
    union all
    select 'active_sessions', count(*)::int from sessions where user_id = ${id} and expires_at > now()
  `)) as unknown as { key: string; count: number }[];

  const tgRows = (await db.execute<{
    telegramId: bigint | null;
    username: string | null;
    linkedAt: Date | null;
  }>(
    sql`select telegram_id as "telegramId", username, linked_at as "linkedAt" from telegram_links where user_id = ${id}`,
  )) as unknown as { telegramId: bigint | null; username: string | null; linkedAt: Date | null }[];

  return { user, counts, telegram: tgRows[0] ?? null };
}

export type LoginHistoryRow = {
  id: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  attemptedAt: Date;
};

export async function getUserLoginHistory(userId: string, limit = 50): Promise<LoginHistoryRow[]> {
  return (await db.execute<LoginHistoryRow>(
    sql`select id, success, failure_reason as "failureReason", ip_address as "ipAddress", user_agent as "userAgent", attempted_at as "attemptedAt"
        from login_history where user_id = ${userId} order by attempted_at desc limit ${limit}`,
  )) as unknown as LoginHistoryRow[];
}
