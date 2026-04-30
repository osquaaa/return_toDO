import os from 'node:os';

import { sql } from 'drizzle-orm';
import { Activity, Cpu, Database, HardDrive, Heart, KeyRound, Server } from 'lucide-react';
import type { ReactNode } from 'react';

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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-widest text-[var(--color-fg-tertiary)] uppercase">
          <Heart size={12} strokeWidth={2.4} />
          Админ
        </div>
        <h1 className="text-balance text-[32px] leading-[1.05] font-semibold tracking-tight text-[var(--color-fg-primary)] md:text-[44px]">
          Здоровье
        </h1>
        <p className="pt-1 text-sm text-[var(--color-fg-secondary)] md:text-base">
          Состояние сервисов и памяти.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card icon={<Database size={16} />} title="Postgres" ok={dbPing.ok}>
          <Stat label="Latency" value={`${dbPing.ms} ms`} />
          <Stat label="Размер БД" value={fmtBytes(dbSizeRows[0]?.bytes ?? 0)} />
          {dbPing.error && (
            <p className="mt-2 truncate font-mono text-[10px] text-[var(--color-danger)]">
              {dbPing.error}
            </p>
          )}
        </Card>

        <Card icon={<HardDrive size={16} />} title="Redis" ok={redisPing.ok}>
          <Stat label="Latency" value={`${redisPing.ms} ms`} />
          {redisPing.error && (
            <p className="mt-2 truncate font-mono text-[10px] text-[var(--color-danger)]">
              {redisPing.error}
            </p>
          )}
        </Card>

        <Card icon={<KeyRound size={16} />} title="Сессии" ok>
          <Stat label="Active" value={(sessionsRows[0]?.count ?? 0).toString()} />
        </Card>

        <Card icon={<Cpu size={16} />} title="Web процесс" ok>
          <Stat label="Uptime" value={fmtDuration(uptimeSec)} />
          <Stat label="RSS" value={`${(mem.rss / 1024 / 1024).toFixed(1)} MB`} />
          <Stat label="Heap used" value={`${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`} />
        </Card>

        <Card icon={<Server size={16} />} title="Сервер" ok>
          <Stat label="Total RAM" value={`${totalMemMB} MB`} />
          <Stat label="Free RAM" value={`${freeMemMB} MB`} />
        </Card>

        <Card icon={<Activity size={16} />} title="Метрики" ok>
          <Stat label="Heap total" value={`${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`} />
          <Stat label="External" value={`${(mem.external / 1024 / 1024).toFixed(1)} MB`} />
        </Card>
      </section>
    </div>
  );
}

function Card({
  icon,
  title,
  ok,
  children,
}: {
  icon: ReactNode;
  title: string;
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-fg-secondary)]">
          {icon}
        </span>
        <h2 className="flex-1 text-base font-semibold tracking-tight text-[var(--color-fg-primary)]">
          {title}
        </h2>
        <span
          className="size-2 rounded-full"
          style={{
            background: ok ? 'var(--color-success)' : 'var(--color-danger)',
            boxShadow: ok
              ? '0 0 0 4px var(--color-success-soft)'
              : '0 0 0 4px var(--color-danger-soft)',
          }}
          aria-label={ok ? 'OK' : 'FAIL'}
        />
      </header>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-fg-secondary)]">{label}</span>
      <span className="font-mono text-xs text-[var(--color-fg-primary)]">{value}</span>
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
