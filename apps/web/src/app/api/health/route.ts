import Redis from 'ioredis';
import { NextResponse } from 'next/server';

import { createDbClient } from '@letget/db';

import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {};
  let allOk = true;

  try {
    const { sql } = createDbClient();
    await sql`SELECT 1`;
    await sql.end();
    checks.db = 'ok';
  } catch (err) {
    console.error('Health: db check failed', err);
    checks.db = 'fail';
    allOk = false;
  }

  let redis: Redis | null = null;
  try {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      db: env.REDIS_DB,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    await redis.connect();
    await redis.ping();
    checks.redis = 'ok';
  } catch (err) {
    console.error('Health: redis check failed', err);
    checks.redis = 'fail';
    allOk = false;
  } finally {
    if (redis) redis.disconnect();
  }

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
