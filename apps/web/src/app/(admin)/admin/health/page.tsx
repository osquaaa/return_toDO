import os from 'node:os';

import { sql } from 'drizzle-orm';

import { createDbClient } from '@letget/db/client';

import { requireAdminContext } from '@/lib/admin/guard';
import { getRedis } from '@/lib/redis';

const { db } = createDbClient();

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Админ — Здоровье' };

type PingResult = { ok: boolean; ms: number; error?: string };

async function ping(fn: () => Promise<unknown>): Promise<PingResult> {
  const start = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function HealthPage() {
  await requireAdminContext();

  const redis = getRedis();
  const dbPing = await ping(() => db.execute(sql`select 1`));
  const redisPing = await ping(() => redis.ping());

  const dbSizeRows = (await db
    .execute<{
      bytes: number;
    }>(sql`select pg_database_size(current_database())::bigint::int as bytes`)
    .catch(() => [{ bytes: 0 }] as { bytes: number }[])) as unknown as { bytes: number }[];

  const sessionsRows = (await db
    .execute<{
      count: number;
    }>(sql`select count(*)::int as count from sessions where expires_at > now()`)
    .catch(() => [{ count: 0 }] as { count: number }[])) as unknown as { count: number }[];

  const mem = process.memoryUsage();
  const uptimeSec = Math.round(process.uptime());
  const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
  const freeMemMB = Math.round(os.freemem() / 1024 / 1024);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Здоровье системы</h1>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Postgres">
          <Stat label="Статус" value={dbPing.ok ? '✓ OK' : '✗ FAIL'} />
          <Stat label="Latency" value={`${dbPing.ms} ms`} />
          <Stat label="Размер БД" value={fmtBytes(dbSizeRows[0]?.bytes ?? 0)} />
          {dbPing.error && <p className="text-xs text-red-700">{dbPing.error}</p>}
        </Card>
        <Card title="Redis">
          <Stat label="Статус" value={redisPing.ok ? '✓ OK' : '✗ FAIL'} />
          <Stat label="Latency" value={`${redisPing.ms} ms`} />
          {redisPing.error && <p className="text-xs text-red-700">{redisPing.error}</p>}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Web процесс">
          <Stat label="Uptime" value={fmtDuration(uptimeSec)} />
          <Stat label="RSS" value={`${(mem.rss / 1024 / 1024).toFixed(1)} MB`} />
          <Stat label="Heap used" value={`${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`} />
        </Card>
        <Card title="Сервер">
          <Stat label="Total RAM" value={`${totalMemMB} MB`} />
          <Stat label="Free RAM" value={`${freeMemMB} MB`} />
          <Stat label="Active sessions" value={(sessionsRows[0]?.count ?? 0).toString()} />
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <h2 className="mb-3 font-medium">{title}</h2>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-ink-soft)]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDuration(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
