import { afterAll, describe, expect, it } from 'vitest';

import { createDbClient } from '../src/client';

describe('db schema integration', () => {
  const { sql } = createDbClient();

  afterAll(async () => {
    await sql.end();
  });

  it('connects to postgres', async () => {
    const result = await sql<Array<{ one: number }>>`SELECT 1 as one`;
    expect(result[0]?.one).toBe(1);
  });

  it('all 25 expected tables exist', async () => {
    const rows = await sql<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT LIKE '%drizzle%'
      ORDER BY tablename
    `;
    const names = rows.map((r) => r.tablename);
    expect(names).toEqual([
      'accounts',
      'admin_audit_log',
      'books',
      'calendar_events',
      'code_snippets',
      'contacts',
      'finance_categories',
      'finance_transactions',
      'habit_checkins',
      'habits',
      'login_history',
      'notification_prefs',
      'notifications_queue',
      'recipe_ingredients',
      'recipes',
      'sessions',
      'shopping_items',
      'shopping_trips',
      'tasks',
      'telegram_links',
      'time_activities',
      'time_sessions',
      'user_preferences',
      'users',
      'verifications',
      'workout_exercises',
      'workout_sets',
    ]);
  });

  it('user_role enum has expected values', async () => {
    const rows = await sql<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ORDER BY enumsortorder
    `;
    expect(rows.map((r) => r.enumlabel)).toEqual(['user', 'admin']);
  });

  it('event_type enum covers all phase 1 events', async () => {
    const rows = await sql<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type')
      ORDER BY enumsortorder
    `;
    expect(rows.map((r) => r.enumlabel)).toEqual([
      'morning_digest',
      'task_deadline',
      'workout_streak_warn',
      'weekly_recap',
      'custom_reminder',
    ]);
  });
});
