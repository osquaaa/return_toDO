import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type Period = '24h' | '7d' | '30d';

const intervalFor = (p: Period) => ({ '24h': '24 hours', '7d': '7 days', '30d': '30 days' })[p];

export async function getDashboardMetrics(period: Period) {
  const interval = intervalFor(period);

  const totalUsersRows = await db.execute<{ totalUsers: number }>(
    sql`select count(*)::int as "totalUsers" from users`,
  );
  const newUsersRows = await db.execute<{ newUsers: number }>(
    sql`select count(*)::int as "newUsers" from users where created_at >= now() - ${sql.raw(`interval '${interval}'`)}`,
  );
  const activeUsersRows = await db.execute<{ activeUsers: number }>(
    sql`select count(distinct user_id)::int as "activeUsers" from login_history where success = true and attempted_at >= now() - ${sql.raw(`interval '${interval}'`)}`,
  );
  const pushStatsRows = await db.execute<{
    sent: number;
    pending: number;
    failed: number;
  }>(sql`
    select
      count(*) filter (where sent_at is not null)::int as sent,
      count(*) filter (where sent_at is null and attempts < 5)::int as pending,
      count(*) filter (where attempts >= 5 and sent_at is null)::int as failed
    from notifications_queue
    where created_at >= now() - ${sql.raw(`interval '${interval}'`)}
  `);
  const moduleActivityRows = await db.execute<{
    tasks: number;
    shoppingItems: number;
    codeSnippets: number;
    workoutSets: number;
  }>(sql`
    select
      (select count(*)::int from tasks where created_at >= now() - ${sql.raw(`interval '${interval}'`)}) as tasks,
      (select count(*)::int from shopping_items where created_at >= now() - ${sql.raw(`interval '${interval}'`)}) as "shoppingItems",
      (select count(*)::int from code_snippets where created_at >= now() - ${sql.raw(`interval '${interval}'`)}) as "codeSnippets",
      (select count(*)::int from workout_sets where performed_at >= now() - ${sql.raw(`interval '${interval}'`)}) as "workoutSets"
  `);

  return {
    period,
    totalUsers: totalUsersRows[0]?.totalUsers ?? 0,
    newUsers: newUsersRows[0]?.newUsers ?? 0,
    activeUsers: activeUsersRows[0]?.activeUsers ?? 0,
    pushStats: pushStatsRows[0] ?? { sent: 0, pending: 0, failed: 0 },
    moduleActivity: moduleActivityRows[0] ?? {
      tasks: 0,
      shoppingItems: 0,
      codeSnippets: 0,
      workoutSets: 0,
    },
  };
}
