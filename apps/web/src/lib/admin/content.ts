import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

const { db } = createDbClient();

export type ContentRow = {
  module: 'tasks' | 'code' | 'shopping';
  contentId: string;
  userId: string;
  email: string;
  preview: string;
  createdAt: Date;
};

const periodInterval = (period?: string) => {
  if (period === '24h') return "interval '24 hours'";
  if (period === '7d') return "interval '7 days'";
  if (period === '30d') return "interval '30 days'";
  return null;
};

export async function searchAllContent(
  q: string,
  filter: { module?: string; period?: string },
  limit = 100,
): Promise<ContentRow[]> {
  const search = q.trim();
  if (!search) return [];

  const interval = periodInterval(filter.period);
  const periodClause = interval ? sql`and t.created_at >= now() - ${sql.raw(interval)}` : sql``;

  const want = filter.module ?? 'all';

  const arms: ReturnType<typeof sql>[] = [];

  if (want === 'all' || want === 'tasks') {
    arms.push(sql`
      select 'tasks' as module, t.id as "contentId", t.user_id as "userId", u.email,
        substring(t.content_text, 1, 200) as preview, t.created_at as "createdAt"
      from tasks t
      join users u on u.id = t.user_id
      where t.deleted_at is null
        and t.search_vector @@ websearch_to_tsquery('russian', ${search})
        ${periodClause}
    `);
  }

  if (want === 'all' || want === 'code') {
    arms.push(sql`
      select 'code' as module, t.id as "contentId", t.user_id as "userId", u.email,
        coalesce(t.title, substring(t.code, 1, 80)) as preview, t.created_at as "createdAt"
      from code_snippets t
      join users u on u.id = t.user_id
      where t.deleted_at is null
        and t.search_vector @@ websearch_to_tsquery('russian', ${search})
        ${periodClause}
    `);
  }

  if (want === 'all' || want === 'shopping') {
    arms.push(sql`
      select 'shopping' as module, t.id as "contentId", tr.user_id as "userId", u.email,
        t.name as preview, t.created_at as "createdAt"
      from shopping_items t
      join shopping_trips tr on tr.id = t.trip_id
      join users u on u.id = tr.user_id
      where t.name ilike ${`%${search}%`}
        ${periodClause}
    `);
  }

  if (arms.length === 0) return [];

  let query = arms[0];
  for (let i = 1; i < arms.length; i++) {
    query = sql`${query} union all ${arms[i]}`;
  }
  query = sql`${query} order by "createdAt" desc limit ${limit}`;

  return (await db.execute<ContentRow>(query)) as unknown as ContentRow[];
}
