# LETget Auth + Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a complete email+password auth system, Telegram account linking, and a one-shot v1→v2 data migration endpoint on top of the foundation.

**Architecture:** Better Auth (credential provider, bcrypt cost 12) with the existing Drizzle schema as adapter target — sessions live in Postgres (not JWT). Resend handles verification + reset emails (with a dev stub that prints to logs). Redis backs both rate limiting (sliding window) and short-lived Telegram link tokens. The bot's `/start` handler consumes link tokens to write `telegram_links`. Migration runs once per user, idempotent via `user_preferences.migratedV1At`.

**Tech Stack:** better-auth, bcryptjs, resend, ioredis, zod, isomorphic-dompurify, Next.js 15 server actions + route handlers, grammY (existing).

---

## File Structure

**apps/web — auth core**

- Create: `src/lib/auth/auth.ts` — Better Auth instance (Drizzle adapter, email/password, hooks)
- Create: `src/lib/auth/session.ts` — `getCurrentUser()` / `requireUser()` for RSC + route handlers
- Create: `src/lib/auth/login-history.ts` — write success/failure rows
- Create: `src/app/api/auth/[...all]/route.ts` — Better Auth handler mount

**apps/web — email + infra**

- Create: `src/lib/email/client.ts` — Resend client + dev stub (selected by env)
- Create: `src/lib/email/templates.ts` — pure functions returning {subject, html, text}
- Create: `src/lib/rate-limit.ts` — Redis sliding-window helper
- Create: `src/lib/sanitize.ts` — server-side DOMPurify wrapper

**apps/web — auth pages (route group `(auth)`)**

- Create: `src/app/(auth)/layout.tsx` — centered card shell, no sidebar
- Create: `src/app/(auth)/sign-up/{page,sign-up-form,actions}.{tsx,ts}`
- Create: `src/app/(auth)/sign-in/{page,sign-in-form,actions}.{tsx,ts}`
- Create: `src/app/(auth)/verify-email/{page,sent/page}.tsx`
- Create: `src/app/(auth)/forgot-password/{page,actions}.{tsx,ts}`
- Create: `src/app/(auth)/reset-password/{page,actions}.{tsx,ts}`

**apps/web — Telegram + migration + settings**

- Create: `src/app/api/telegram/link-token/route.ts` — POST issues UUID v4 token
- Create: `src/app/api/telegram/unlink/route.ts` — POST removes link
- Create: `src/app/api/telegram/status/route.ts` — GET current link state (used by polling on settings)
- Create: `src/app/api/migrate/v1/route.ts` — POST imports legacy localStorage payload
- Create: `src/lib/telegram/link.ts` — Redis token primitives (issue/consume)
- Create: `src/lib/migrate/v1.ts` — mappers + transactional importer
- Create: `src/app/(modules)/settings/{page,telegram-card,profile-card}.tsx`
- Create: `src/components/migration/migrate-listener.tsx` — client-side first-login trigger

**apps/web — middleware + shell**

- Create: `src/middleware.ts` — redirects unauth users from modules/admin
- Edit: `src/components/layout/Topbar.tsx` — add user menu + sign out
- Edit: `src/components/layout/Sidebar.tsx` — add Settings link

**apps/bot — link consumer**

- Edit: `src/handlers/start.ts` — parse `link_<token>` payload
- Create: `src/services/link-account.ts` — DB writes + Redis delete

**packages/lib — schemas**

- Create: `src/zod/migrate.ts` — `v1MigrationSchema`
- Edit: `src/zod/index.ts` — re-export
- Create: `tests/migrate.test.ts`

**Tests**

- `apps/web/tests/auth/{sign-up,sign-in,session,login-history,reset-password}.test.ts`
- `apps/web/tests/email/client.test.ts`
- `apps/web/tests/rate-limit.test.ts`
- `apps/web/tests/telegram/link.test.ts`
- `apps/web/tests/migrate/v1.test.ts`
- `apps/bot/tests/link-account.test.ts`

---

## Conventions used in this plan

- All passwords in tests use the helper `makeValidPassword()` (already in `packages/lib/tests/helpers.ts` from Plan 1). Never inline literal passwords in code or tests.
- All `.env` keys appear with empty values (e.g. `BETTER_AUTH_SECRET=`) when shown in templates, since the project's secret-scanner blocks literal credentials.
- DB connection uses `createDbClient()` from `@letget/db` — never construct connection strings inline.
- Every server action returns either `{ok: true, data?}` or `{ok: false, error: string, code?: string}`.
- Every route handler uses `requireUser()` (from `auth/session.ts`) at the top, except the auth/[...all] route which Better Auth owns.
- Run `pnpm -F @letget/web test` (or `-F @letget/bot`) for app tests; `pnpm -r test` for everything.
- Commit per task with imperative lowercase messages (style established in Plan 1).

---

## Group A: Better Auth bootstrap

### Task 1: Install Better Auth + bcrypt deps in `apps/web`

**Files:**

- Modify: `apps/web/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm -F @letget/web add better-auth bcryptjs isomorphic-dompurify resend
pnpm -F @letget/web add -D @types/bcryptjs
```

- [ ] **Step 2: Verify versions in package.json**

Run: `cat apps/web/package.json | grep -E "(better-auth|bcryptjs|resend|isomorphic-dompurify)"`
Expected: four matching lines, all on caret (`^`) ranges.

- [ ] **Step 3: Reinstall lockfile from root + commit**

```bash
pnpm install
git add apps/web/package.json pnpm-lock.yaml
git commit -m "web: add better-auth + bcryptjs + resend deps"
```

---

### Task 2: Configure Better Auth instance

**Files:**

- Create: `apps/web/src/lib/auth/auth.ts`
- Create: `apps/web/src/lib/auth/db-adapter.ts` (re-exports a Drizzle adapter pre-bound to our client)
- Modify: `apps/web/src/lib/env.ts` (add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `ADMIN_EMAIL` — all optional in dev with `.optional()` or sane defaults)
- Test: `apps/web/tests/auth/auth-instance.test.ts`

- [ ] **Step 1: Extend env schema**

Edit `apps/web/src/lib/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  REDIS_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be ≥32 chars'),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
```

- [ ] **Step 2: Create db adapter wrapper**

Create `apps/web/src/lib/auth/db-adapter.ts`:

```ts
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDbClient } from '@letget/db/client';
import * as schema from '@letget/db/schema';

const { db } = createDbClient();

export const adapter = drizzleAdapter(db, {
  provider: 'pg',
  schema: {
    user: schema.users,
    session: schema.sessions,
    account: schema.accounts,
    verification: schema.verifications,
  },
});
```

- [ ] **Step 3: Write failing test for auth instance**

Create `apps/web/tests/auth/auth-instance.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { auth } from '../../src/lib/auth/auth';

describe('auth instance', () => {
  it('exposes a Next.js handler', () => {
    expect(auth.handler).toBeTypeOf('function');
  });
  it('exposes the api object with sign-up endpoint', () => {
    expect(auth.api.signUpEmail).toBeTypeOf('function');
  });
});
```

Run: `pnpm -F @letget/web vitest run tests/auth/auth-instance.test.ts`
Expected: FAIL — module `../../src/lib/auth/auth` does not exist.

- [ ] **Step 4: Implement `auth.ts`**

Create `apps/web/src/lib/auth/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import bcrypt from 'bcryptjs';
import { env } from '../env';
import { adapter } from './db-adapter';

export const auth = betterAuth({
  database: adapter,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: (plain) => bcrypt.hash(plain, 12),
      verify: ({ password, hash }) => bcrypt.compare(password, hash),
    },
  },
});

export type Auth = typeof auth;
```

- [ ] **Step 5: Run test to verify**

Run: `pnpm -F @letget/web vitest run tests/auth/auth-instance.test.ts`
Expected: PASS, 2/2 green.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/auth apps/web/src/lib/env.ts apps/web/tests/auth
git commit -m "web/auth: better auth instance + drizzle adapter"
```

---

### Task 3: Mount Better Auth at `/api/auth/[...all]`

**Files:**

- Create: `apps/web/src/app/api/auth/[...all]/route.ts`
- Test: `apps/web/tests/auth/route-mount.test.ts`

- [ ] **Step 1: Write failing test (boot-only)**

Create `apps/web/tests/auth/route-mount.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import * as route from '../../src/app/api/auth/[...all]/route';

describe('auth catch-all route', () => {
  it('exports GET and POST handlers', () => {
    expect(route.GET).toBeTypeOf('function');
    expect(route.POST).toBeTypeOf('function');
  });
});
```

Run: `pnpm -F @letget/web vitest run tests/auth/route-mount.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: Implement route**

Create `apps/web/src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth/auth';

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 3: Run test**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/auth apps/web/tests/auth/route-mount.test.ts
git commit -m "web/auth: mount /api/auth/[...all]"
```

---

### Task 4: Session helper for RSC + route handlers

**Files:**

- Create: `apps/web/src/lib/auth/session.ts`
- Test: `apps/web/tests/auth/session.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/session.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

describe('getCurrentUser', () => {
  it('returns null when no session', async () => {
    const { getCurrentUser } = await import('../../src/lib/auth/session');
    const u = await getCurrentUser();
    expect(u).toBeNull();
  });

  it('returns user when session present', async () => {
    const mod = await import('../../src/lib/auth/auth');
    (mod.auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: 'u1', email: 'a@b.c', role: 'user' },
      session: { id: 's1' },
    });
    const { getCurrentUser } = await import('../../src/lib/auth/session');
    const u = await getCurrentUser();
    expect(u?.id).toBe('u1');
  });
});
```

Run: FAIL (module missing).

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/auth/session.ts`:

```ts
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/session.test.ts
git add apps/web/src/lib/auth/session.ts apps/web/tests/auth/session.test.ts
git commit -m "web/auth: getCurrentUser + requireUser/requireAdmin"
```

---

## Group B: Email + rate limit infra

### Task 5: Resend client wrapper with dev stub

**Files:**

- Create: `apps/web/src/lib/email/client.ts`
- Test: `apps/web/tests/email/client.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/email/client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('email client', () => {
  it('uses dev stub when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const { sendEmail } = await import('../../src/lib/email/client');
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendEmail({ to: 'a@b.c', subject: 'hi', html: '<b>hi</b>', text: 'hi' });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
```

Run: `pnpm -F @letget/web vitest run tests/email/client.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/email/client.ts`:

```ts
import { Resend } from 'resend';

type SendArgs = { to: string; subject: string; html: string; text: string };

let resendInstance: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendInstance) resendInstance = new Resend(key);
  return resendInstance;
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const client = getClient();
  if (!client) {
    console.info('[email:dev-stub]', { to: args.to, subject: args.subject, text: args.text });
    return;
  }
  await client.emails.send({
    from: 'LETget <noreply@letget.spassonic.ru>',
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/email/client.test.ts
git add apps/web/src/lib/email apps/web/tests/email
git commit -m "web/email: resend client with dev-stub fallback"
```

---

### Task 6: Email templates (verify + reset)

**Files:**

- Create: `apps/web/src/lib/email/templates.ts`
- Test: `apps/web/tests/email/templates.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/email/templates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { verifyEmailTemplate, resetPasswordTemplate } from '../../src/lib/email/templates';

describe('email templates', () => {
  it('verifyEmailTemplate produces all three fields with the URL embedded', () => {
    const t = verifyEmailTemplate({ name: 'Иван', url: 'https://example.test/x' });
    expect(t.subject).toMatch(/LETget/i);
    expect(t.html).toContain('https://example.test/x');
    expect(t.text).toContain('https://example.test/x');
  });
  it('resetPasswordTemplate works similarly', () => {
    const t = resetPasswordTemplate({ name: null, url: 'https://example.test/r' });
    expect(t.html).toContain('https://example.test/r');
    expect(t.text).toContain('https://example.test/r');
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/email/templates.ts`:

```ts
type Template = { subject: string; html: string; text: string };

const greet = (name: string | null) => (name ? `Привет, ${name}!` : 'Привет!');

export function verifyEmailTemplate(opts: { name: string | null; url: string }): Template {
  return {
    subject: 'LETget — подтвердите email',
    html: `
<!doctype html><meta charset="utf-8" />
<div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px">${greet(opts.name)}</h1>
  <p>Подтвердите свой email, чтобы активировать аккаунт LETget.</p>
  <p><a href="${opts.url}" style="display:inline-block;padding:12px 20px;background:#1a1410;color:#fcf8f1;text-decoration:none;border-radius:12px">Подтвердить email</a></p>
  <p style="color:#7a7066;font-size:13px">Если кнопка не работает: ${opts.url}</p>
  <p style="color:#7a7066;font-size:13px">Срок действия — 24 часа.</p>
</div>`.trim(),
    text: `${greet(opts.name)}\n\nПодтвердите email: ${opts.url}\n\nСсылка действует 24 часа.`,
  };
}

export function resetPasswordTemplate(opts: { name: string | null; url: string }): Template {
  return {
    subject: 'LETget — сброс пароля',
    html: `
<!doctype html><meta charset="utf-8" />
<div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px">${greet(opts.name)}</h1>
  <p>Кто-то запросил сброс пароля для вашего аккаунта.</p>
  <p><a href="${opts.url}" style="display:inline-block;padding:12px 20px;background:#1a1410;color:#fcf8f1;text-decoration:none;border-radius:12px">Сбросить пароль</a></p>
  <p style="color:#7a7066;font-size:13px">Ссылка действует 15 минут. Если это были не вы — просто проигнорируйте письмо.</p>
</div>`.trim(),
    text: `${greet(opts.name)}\n\nСброс пароля: ${opts.url}\n\nСсылка действует 15 минут.`,
  };
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/email/templates.test.ts
git add apps/web/src/lib/email/templates.ts apps/web/tests/email/templates.test.ts
git commit -m "web/email: verify + reset templates"
```

---

### Task 7: Redis sliding-window rate limiter

**Files:**

- Create: `apps/web/src/lib/redis.ts` (shared singleton)
- Create: `apps/web/src/lib/rate-limit.ts`
- Test: `apps/web/tests/rate-limit.test.ts`

- [ ] **Step 1: Redis singleton**

Create `apps/web/src/lib/redis.ts`:

```ts
import Redis from 'ioredis';
import { env } from './env';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
  }
  return client;
}
```

- [ ] **Step 2: Failing test**

Create `apps/web/tests/rate-limit.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { checkLimit } from '../src/lib/rate-limit';
import { getRedis } from '../src/lib/redis';

const redis = getRedis();

afterEach(async () => {
  await redis.flushdb();
});

describe('checkLimit', () => {
  it('allows up to max within window, blocks after', async () => {
    const opts = { key: 'test:rl:1', max: 3, windowSec: 60 };
    expect((await checkLimit(opts)).allowed).toBe(true);
    expect((await checkLimit(opts)).allowed).toBe(true);
    expect((await checkLimit(opts)).allowed).toBe(true);
    const over = await checkLimit(opts);
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });
});
```

Run: FAIL.

- [ ] **Step 3: Implement (sequential ZSET, no pipeline)**

Create `apps/web/src/lib/rate-limit.ts`:

```ts
import { getRedis } from './redis';

type Opts = { key: string; max: number; windowSec: number };
type Result = { allowed: boolean; remaining: number; resetAt: number };

export async function checkLimit({ key, max, windowSec }: Opts): Promise<Result> {
  const redis = getRedis();
  const now = Date.now();
  const cutoff = now - windowSec * 1000;
  const fullKey = `rl:${key}`;
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  await redis.zremrangebyscore(fullKey, 0, cutoff);
  await redis.zadd(fullKey, now, member);
  const count = await redis.zcard(fullKey);
  await redis.pexpire(fullKey, windowSec * 1000);

  if (count > max) {
    await redis.zrem(fullKey, member);
    return { allowed: false, remaining: 0, resetAt: now + windowSec * 1000 };
  }
  return { allowed: true, remaining: max - count, resetAt: now + windowSec * 1000 };
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/rate-limit.test.ts
git add apps/web/src/lib/redis.ts apps/web/src/lib/rate-limit.ts apps/web/tests/rate-limit.test.ts
git commit -m "web/lib: redis singleton + sliding-window rate limit"
```

---

## Group C: Sign-up + email verification

### Task 8: Wire email verification + role promotion into Better Auth

**Files:**

- Modify: `apps/web/src/lib/auth/auth.ts`
- Modify: `packages/db/src/schema/auth.ts` — confirm `role` column already exposed (no schema change; just verify column)
- Test: `apps/web/tests/auth/sign-up-hooks.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/sign-up-hooks.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

describe('sign-up hooks', () => {
  it('promotes user to admin when email matches ADMIN_EMAIL', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@letget.test');
    const { resolveRoleForEmail } = await import('../../src/lib/auth/role-policy');
    expect(resolveRoleForEmail('admin@letget.test')).toBe('admin');
    expect(resolveRoleForEmail('user@letget.test')).toBe('user');
  });

  it('returns user when ADMIN_EMAIL unset', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    vi.resetModules();
    const { resolveRoleForEmail } = await import('../../src/lib/auth/role-policy');
    expect(resolveRoleForEmail('admin@letget.test')).toBe('user');
  });
});
```

Run: FAIL — module missing.

- [ ] **Step 2: Implement role-policy**

Create `apps/web/src/lib/auth/role-policy.ts`:

```ts
export function resolveRoleForEmail(email: string): 'user' | 'admin' {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return 'user';
  return email.trim().toLowerCase() === adminEmail ? 'admin' : 'user';
}
```

- [ ] **Step 3: Wire role + verification into auth instance**

Edit `apps/web/src/lib/auth/auth.ts` — extend the existing `betterAuth(...)` config:

```ts
import { betterAuth } from 'better-auth';
import bcrypt from 'bcryptjs';
import { env } from '../env';
import { adapter } from './db-adapter';
import { resolveRoleForEmail } from './role-policy';
import { sendEmail } from '../email/client';
import { verifyEmailTemplate, resetPasswordTemplate } from '../email/templates';

export const auth = betterAuth({
  database: adapter,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: (plain) => bcrypt.hash(plain, 12),
      verify: ({ password, hash }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      const tpl = resetPasswordTemplate({ name: user.name ?? null, url });
      await sendEmail({ to: user.email, ...tpl });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const tpl = verifyEmailTemplate({ name: user.name ?? null, url });
      await sendEmail({ to: user.email, ...tpl });
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, role: resolveRoleForEmail(user.email) },
        }),
      },
    },
  },
});

export type Auth = typeof auth;
```

- [ ] **Step 4: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/sign-up-hooks.test.ts
git add apps/web/src/lib/auth
git commit -m "web/auth: email verification + admin role promotion"
```

---

### Task 9: Sign-up server action + page

**Files:**

- Create: `apps/web/src/app/(auth)/layout.tsx`
- Create: `apps/web/src/app/(auth)/sign-up/page.tsx`
- Create: `apps/web/src/app/(auth)/sign-up/sign-up-form.tsx` (`'use client'`)
- Create: `apps/web/src/app/(auth)/sign-up/actions.ts` (`'use server'`)
- Test: `apps/web/tests/auth/sign-up-action.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/sign-up-action.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(async ({ body }) => ({ user: { id: 'u1', email: body.email } })),
    },
  },
}));

describe('signUp action', () => {
  it('returns ok:false on invalid input', async () => {
    const { signUp } = await import('../../src/app/(auth)/sign-up/actions');
    const res = await signUp({
      name: '',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(res.ok).toBe(false);
  });

  it('passes valid input to Better Auth', async () => {
    const { makeValidPassword } = await import('@letget/lib/tests/helpers');
    const { signUp } = await import('../../src/app/(auth)/sign-up/actions');
    const pwd = makeValidPassword();
    const res = await signUp({
      name: 'Иван',
      email: 'a@b.co',
      password: pwd,
      confirmPassword: pwd,
    });
    expect(res.ok).toBe(true);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Server action**

Create `apps/web/src/app/(auth)/sign-up/actions.ts`:

```ts
'use server';

import { signUpSchema } from '@letget/lib/zod/auth';
import { auth } from '@/lib/auth/auth';

type Result = { ok: true } | { ok: false; error: string; field?: string };

export async function signUp(input: unknown): Promise<Result> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0]) };
  }
  try {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Не удалось зарегистрироваться';
    return { ok: false, error: msg };
  }
}
```

- [ ] **Step 3: Auth layout**

Create `apps/web/src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[var(--color-cream-50)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white/70 p-8 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl text-[var(--color-ink)]">LETget</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Form component**

Create `apps/web/src/app/(auth)/sign-up/sign-up-form.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from './actions';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await signUp(Object.fromEntries(fd));
          if (!res.ok) setError(res.error);
          else router.push('/verify-email/sent');
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Имя</span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Пароль</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Повторите пароль</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-white disabled:opacity-50"
      >
        {isPending ? 'Создаём…' : 'Создать аккаунт'}
      </button>
      <p className="text-center text-sm text-[var(--color-ink)]/70">
        Уже есть аккаунт?{' '}
        <Link href="/sign-in" className="underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 5: Page**

Create `apps/web/src/app/(auth)/sign-up/page.tsx`:

```tsx
import { SignUpForm } from './sign-up-form';

export const metadata = { title: 'Регистрация — LETget' };

export default function SignUpPage() {
  return <SignUpForm />;
}
```

- [ ] **Step 6: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/sign-up-action.test.ts
git add apps/web/src/app/\(auth\)
git commit -m "web/auth: sign-up form + action"
```

---

### Task 10: Verify-email landing pages

**Files:**

- Create: `apps/web/src/app/(auth)/verify-email/sent/page.tsx`
- Create: `apps/web/src/app/(auth)/verify-email/page.tsx` (handles success/error from Better Auth callback)
- Test: none (UI only — no logic worth isolated testing; covered by smoke later)

- [ ] **Step 1: "Sent" page**

Create `apps/web/src/app/(auth)/verify-email/sent/page.tsx`:

```tsx
export const metadata = { title: 'Проверьте почту — LETget' };

export default function VerifySentPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-xl">Почти готово</h2>
      <p className="text-sm text-[var(--color-ink)]/70">
        Мы отправили письмо для подтверждения email. Проверь входящие и спам. Ссылка действует 24
        часа.
      </p>
      <p className="text-xs text-[var(--color-ink)]/50">
        Не пришло? Проверь, что email введён правильно. Можно зарегистрироваться ещё раз.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Result page**

Create `apps/web/src/app/(auth)/verify-email/page.tsx`:

```tsx
import Link from 'next/link';

export const metadata = { title: 'Подтверждение email — LETget' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (params.error) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="font-display text-xl">Не получилось</h2>
        <p className="text-sm text-red-700">
          Ссылка истекла или некорректна. Зарегистрируйся заново.
        </p>
        <Link href="/sign-up" className="text-sm underline">
          К регистрации
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-xl">Email подтверждён</h2>
      <Link href="/" className="text-sm underline">
        Перейти в LETget
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(auth\)/verify-email
git commit -m "web/auth: verify-email sent + result pages"
```

---

## Group D: Sign-in + sessions + password reset

> **Test convention:** all tests in this group import `makeValidPassword`, `makeShortPassword`, `makeNoUpperPassword` from `@letget/lib/tests/helpers` (added in Plan 1) instead of inlining password literals. Same applies to any future password reference in plan code.

### Task 11: login_history writer

**Files:**

- Create: `apps/web/src/lib/auth/login-history.ts`
- Test: `apps/web/tests/auth/login-history.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/login-history.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createDbClient } from '@letget/db/client';
import { loginHistory } from '@letget/db/schema';
import { recordLoginAttempt } from '../../src/lib/auth/login-history';

const { db } = createDbClient();

describe('recordLoginAttempt', () => {
  it('inserts a success row with userId', async () => {
    const before = await db.select().from(loginHistory);
    await recordLoginAttempt({
      email: 'x@y.z',
      success: true,
      userId: '00000000-0000-7000-8000-000000000001',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const after = await db.select().from(loginHistory);
    expect(after.length).toBe(before.length + 1);
  });

  it('inserts a failure row with no userId and a reason', async () => {
    await recordLoginAttempt({
      email: 'unknown@y.z',
      success: false,
      failureReason: 'wrong_password',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    const rows = await db.select().from(loginHistory);
    expect(rows.some((r) => r.failureReason === 'wrong_password')).toBe(true);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/auth/login-history.ts`:

```ts
import { createDbClient } from '@letget/db/client';
import { loginHistory } from '@letget/db/schema';
import { genId } from '@letget/db/id';

const { db } = createDbClient();

type Args = {
  userId?: string | null;
  email: string;
  success: boolean;
  failureReason?: 'wrong_password' | 'email_not_verified' | 'account_disabled' | 'rate_limited';
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordLoginAttempt(args: Args): Promise<void> {
  await db.insert(loginHistory).values({
    id: genId(),
    userId: args.userId ?? null,
    email: args.email,
    success: args.success,
    failureReason: args.failureReason ?? null,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
    attemptedAt: new Date(),
  });
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/login-history.test.ts
git add apps/web/src/lib/auth/login-history.ts apps/web/tests/auth/login-history.test.ts
git commit -m "web/auth: login_history writer"
```

---

### Task 12: Sign-in server action with rate limit + history

**Files:**

- Create: `apps/web/src/app/(auth)/sign-in/page.tsx`
- Create: `apps/web/src/app/(auth)/sign-in/sign-in-form.tsx`
- Create: `apps/web/src/app/(auth)/sign-in/actions.ts`
- Test: `apps/web/tests/auth/sign-in-action.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/sign-in-action.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { makeValidPassword } from '@letget/lib/tests/helpers';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers([['x-forwarded-for', '127.0.0.1']])),
}));
vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(async () => ({ user: { id: 'u1', email: 'a@b.c' } })),
    },
  },
}));
vi.mock('../../src/lib/auth/login-history', () => ({
  recordLoginAttempt: vi.fn(async () => {}),
}));
vi.mock('../../src/lib/rate-limit', () => ({
  checkLimit: vi.fn(async () => ({ allowed: true, remaining: 4, resetAt: 0 })),
}));

const validInput = () => ({ email: 'a@b.c', password: makeValidPassword() });

describe('signIn action', () => {
  it('rejects rate-limited requests', async () => {
    const rl = await import('../../src/lib/rate-limit');
    (rl.checkLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: 0,
    });
    const { signIn } = await import('../../src/app/(auth)/sign-in/actions');
    const res = await signIn(validInput());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('rate_limited');
  });

  it('records success and returns ok', async () => {
    const { signIn } = await import('../../src/app/(auth)/sign-in/actions');
    const res = await signIn(validInput());
    expect(res.ok).toBe(true);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Action**

Create `apps/web/src/app/(auth)/sign-in/actions.ts`:

```ts
'use server';

import { headers } from 'next/headers';
import { signInSchema } from '@letget/lib/zod/auth';
import { auth } from '@/lib/auth/auth';
import { recordLoginAttempt } from '@/lib/auth/login-history';
import { checkLimit } from '@/lib/rate-limit';

type Result = { ok: true } | { ok: false; error: string; code?: string };

export async function signIn(input: unknown): Promise<Result> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
  const ua = hdrs.get('user-agent') ?? null;

  const limit = await checkLimit({ key: `signin:${ip ?? 'noip'}`, max: 5, windowSec: 900 });
  if (!limit.allowed) {
    await recordLoginAttempt({
      email: parsed.data.email,
      success: false,
      failureReason: 'rate_limited',
      ipAddress: ip,
      userAgent: ua,
    });
    return {
      ok: false,
      error: 'Слишком много попыток. Попробуй через 15 минут.',
      code: 'rate_limited',
    };
  }

  try {
    const result = await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: hdrs,
    });
    await recordLoginAttempt({
      email: parsed.data.email,
      success: true,
      userId: result.user.id,
      ipAddress: ip,
      userAgent: ua,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Не удалось войти';
    const reason = msg.toLowerCase().includes('verif') ? 'email_not_verified' : 'wrong_password';
    await recordLoginAttempt({
      email: parsed.data.email,
      success: false,
      failureReason: reason,
      ipAddress: ip,
      userAgent: ua,
    });
    return { ok: false, error: msg, code: reason };
  }
}
```

- [ ] **Step 3: Form**

Create `apps/web/src/app/(auth)/sign-in/sign-in-form.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from './actions';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await signIn(Object.fromEntries(fd));
          if (!res.ok) setError(res.error);
          else router.push('/');
        });
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm">Пароль</span>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-white disabled:opacity-50"
      >
        {isPending ? 'Входим…' : 'Войти'}
      </button>
      <div className="flex justify-between text-xs text-[var(--color-ink)]/70">
        <Link href="/forgot-password" className="underline">
          Забыл пароль
        </Link>
        <Link href="/sign-up" className="underline">
          Создать аккаунт
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Page**

Create `apps/web/src/app/(auth)/sign-in/page.tsx`:

```tsx
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Вход — LETget' };

export default function SignInPage() {
  return <SignInForm />;
}
```

- [ ] **Step 5: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/sign-in-action.test.ts
git add apps/web/src/app/\(auth\)/sign-in
git commit -m "web/auth: sign-in form + action with rate limit"
```

---

### Task 13: Forgot password + reset pages

**Files:**

- Create: `apps/web/src/app/(auth)/forgot-password/{page,actions}.{tsx,ts}`
- Create: `apps/web/src/app/(auth)/reset-password/{page,actions}.{tsx,ts}`
- Test: `apps/web/tests/auth/reset-password.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/auth/reset-password.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { makeShortPassword } from '@letget/lib/tests/helpers';

vi.mock('../../src/lib/auth/auth', () => ({
  auth: {
    api: {
      forgetPassword: vi.fn(async () => ({})),
      resetPassword: vi.fn(async () => ({})),
    },
  },
}));

describe('reset password actions', () => {
  it('forget always returns ok (anti-enumeration)', async () => {
    const { requestReset } = await import('../../src/app/(auth)/forgot-password/actions');
    const res = await requestReset({ email: 'unknown@x.y' });
    expect(res.ok).toBe(true);
  });

  it('reset rejects too-short password', async () => {
    const tooShort = makeShortPassword();
    const { performReset } = await import('../../src/app/(auth)/reset-password/actions');
    const res = await performReset({ token: '', password: tooShort, confirmPassword: tooShort });
    expect(res.ok).toBe(false);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Forgot action**

Create `apps/web/src/app/(auth)/forgot-password/actions.ts`:

```ts
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

const requestSchema = z.object({ email: z.string().email() });

export async function requestReset(input: unknown): Promise<{ ok: true }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: true };
  try {
    await auth.api.forgetPassword({
      body: { email: parsed.data.email, redirectTo: '/reset-password' },
    });
  } catch {
    /* swallow — anti-enumeration */
  }
  return { ok: true };
}
```

- [ ] **Step 3: Forgot page**

Create `apps/web/src/app/(auth)/forgot-password/page.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { requestReset } from './actions';

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-center text-sm text-[var(--color-ink)]/80">
        Если такой email есть в системе, мы отправили инструкцию для сброса.
      </p>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await requestReset(Object.fromEntries(fd));
          setDone(true);
        });
      }}
      className="space-y-4"
    >
      <h2 className="font-display text-xl text-center">Сброс пароля</h2>
      <input
        type="email"
        name="email"
        required
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-white disabled:opacity-50"
      >
        {isPending ? 'Отправляем…' : 'Прислать ссылку'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Reset action**

Create `apps/web/src/app/(auth)/reset-password/actions.ts`:

```ts
'use server';

import { passwordResetSchema } from '@letget/lib/zod/auth';
import { auth } from '@/lib/auth/auth';

type Result = { ok: true } | { ok: false; error: string };

export async function performReset(input: unknown): Promise<Result> {
  const parsed = passwordResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Ссылка некорректна или истекла',
    };
  }
}
```

- [ ] **Step 5: Reset page**

Create `apps/web/src/app/(auth)/reset-password/page.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { performReset } from './actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await performReset({ ...Object.fromEntries(fd), token });
          if (!res.ok) setError(res.error);
          else router.push('/sign-in?reset=1');
        });
      }}
      className="space-y-4"
    >
      <h2 className="font-display text-xl text-center">Новый пароль</h2>
      <input
        type="password"
        name="password"
        required
        minLength={8}
        placeholder="Новый пароль"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
      />
      <input
        type="password"
        name="confirmPassword"
        required
        minLength={8}
        placeholder="Повторите"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !token}
        className="w-full rounded-2xl bg-[var(--color-ink)] py-2.5 text-white disabled:opacity-50"
      >
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/auth/reset-password.test.ts
git add apps/web/src/app/\(auth\)/forgot-password apps/web/src/app/\(auth\)/reset-password
git commit -m "web/auth: forgot + reset password flow"
```

---

### Task 14: Middleware redirect + sign-out button

**Files:**

- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/components/layout/sign-out-button.tsx`
- Modify: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: Middleware**

Create `apps/web/src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/health'))
    return NextResponse.next();

  const sessionCookie = req.cookies.get('better-auth.session_token');
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

> **Note:** middleware does a presence-only cookie check (cheap edge-runtime guard). The actual session validation still happens in `requireUser()` on the page/route handler — defense in depth.

- [ ] **Step 2: Sign-out button**

Create `apps/web/src/components/layout/sign-out-button.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await fetch('/api/auth/sign-out', { method: 'POST' });
          router.push('/sign-in');
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-sm text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] disabled:opacity-50"
    >
      Выйти
    </button>
  );
}
```

- [ ] **Step 3: Topbar wires user info**

Edit `apps/web/src/components/layout/Topbar.tsx` — convert to async server component:

```tsx
import { getCurrentUser } from '@/lib/auth/session';
import { SignOutButton } from './sign-out-button';

export async function Topbar() {
  const user = await getCurrentUser();
  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white/60 px-4 py-3 backdrop-blur lg:px-8">
      <div className="font-display text-lg">LETget</div>
      <div className="flex items-center gap-3 text-sm">
        {user && (
          <>
            <span className="text-[var(--color-ink)]/70">{user.name ?? user.email}</span>
            <SignOutButton />
          </>
        )}
      </div>
    </header>
  );
}
```

(Caller in `AppShell.tsx` may need `await Topbar()` if currently called as JSX — adjust to `<Topbar />` because it's now an async server component, no change needed for JSX usage.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/middleware.ts apps/web/src/components/layout
git commit -m "web/auth: middleware redirect + topbar user menu"
```

---

## Group E: Telegram link

### Task 15: Link-token Redis primitives

**Files:**

- Create: `apps/web/src/lib/telegram/link.ts`
- Test: `apps/web/tests/telegram/link.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/telegram/link.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { issueLinkToken, consumeLinkToken } from '../../src/lib/telegram/link';
import { getRedis } from '../../src/lib/redis';

const redis = getRedis();
afterEach(async () => {
  await redis.flushdb();
});

describe('telegram link tokens', () => {
  it('issue → consume returns userId, then token is gone', async () => {
    const userId = '00000000-0000-7000-8000-000000000abc';
    const token = await issueLinkToken(userId);
    expect(token).toMatch(/^[a-f0-9-]{36}$/);
    const first = await consumeLinkToken(token);
    expect(first).toBe(userId);
    const second = await consumeLinkToken(token);
    expect(second).toBeNull();
  });

  it('returns null for unknown token', async () => {
    expect(await consumeLinkToken('non-existent-token')).toBeNull();
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/telegram/link.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { getRedis } from '../redis';

const TTL_SECONDS = 600;

const key = (token: string) => `tglink:${token}`;

export async function issueLinkToken(userId: string): Promise<string> {
  const token = randomUUID();
  await getRedis().set(key(token), userId, 'EX', TTL_SECONDS);
  return token;
}

export async function consumeLinkToken(token: string): Promise<string | null> {
  const redis = getRedis();
  const userId = await redis.get(key(token));
  if (!userId) return null;
  await redis.del(key(token));
  return userId;
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/telegram/link.test.ts
git add apps/web/src/lib/telegram apps/web/tests/telegram
git commit -m "web/tg: link token issue + consume in redis"
```

---

### Task 16: Web routes for link/unlink/status

**Files:**

- Create: `apps/web/src/app/api/telegram/link-token/route.ts`
- Create: `apps/web/src/app/api/telegram/unlink/route.ts`
- Create: `apps/web/src/app/api/telegram/status/route.ts`

- [ ] **Step 1: Issue token route**

Create `apps/web/src/app/api/telegram/link-token/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { issueLinkToken } from '@/lib/telegram/link';
import { env } from '@/lib/env';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'letget_bot';

export async function POST() {
  const user = await requireUser();
  const token = await issueLinkToken(user.id);
  return NextResponse.json({
    token,
    deepLink: `https://t.me/${BOT_USERNAME}?start=link_${token}`,
    expiresInSec: 600,
  });
}
```

- [ ] **Step 2: Status route (used by polling)**

Create `apps/web/src/app/api/telegram/status/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';
import { requireUser } from '@/lib/auth/session';

const { db } = createDbClient();

export async function GET() {
  const user = await requireUser();
  const rows = await db.select().from(telegramLinks).where(eq(telegramLinks.userId, user.id));
  if (rows.length === 0) return NextResponse.json({ linked: false });
  return NextResponse.json({
    linked: true,
    username: rows[0].username,
    linkedAt: rows[0].linkedAt,
  });
}
```

- [ ] **Step 3: Unlink route**

Create `apps/web/src/app/api/telegram/unlink/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';
import { requireUser } from '@/lib/auth/session';

const { db } = createDbClient();

export async function POST() {
  const user = await requireUser();
  await db.delete(telegramLinks).where(eq(telegramLinks.userId, user.id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/telegram
git commit -m "web/tg: link-token + status + unlink routes"
```

---

### Task 17: Settings page with Telegram card

**Files:**

- Create: `apps/web/src/app/(modules)/settings/page.tsx`
- Create: `apps/web/src/app/(modules)/settings/telegram-card.tsx`

- [ ] **Step 1: Page (server)**

Create `apps/web/src/app/(modules)/settings/page.tsx`:

```tsx
import { requireUser } from '@/lib/auth/session';
import { TelegramCard } from './telegram-card';

export const metadata = { title: 'Настройки — LETget' };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-display text-2xl">Настройки</h1>
      <section className="rounded-3xl bg-white/70 p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-medium">Профиль</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-[var(--color-ink)]/60">Имя</dt>
          <dd>{user.name ?? '—'}</dd>
          <dt className="text-[var(--color-ink)]/60">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-[var(--color-ink)]/60">Роль</dt>
          <dd>{user.role}</dd>
        </dl>
      </section>
      <TelegramCard />
    </div>
  );
}
```

- [ ] **Step 2: Telegram card (client) with deep link + polling**

Create `apps/web/src/app/(modules)/settings/telegram-card.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';

type Status = { linked: false } | { linked: true; username: string | null; linkedAt: string };

export function TelegramCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [linkInfo, setLinkInfo] = useState<{ deepLink: string } | null>(null);

  const refresh = async () => {
    const r = await fetch('/api/telegram/status');
    setStatus(await r.json());
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!linkInfo) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [linkInfo]);

  useEffect(() => {
    if (status?.linked) setLinkInfo(null);
  }, [status]);

  if (!status)
    return (
      <section className="rounded-3xl bg-white/70 p-6 shadow-[var(--shadow-card)]">
        Загрузка…
      </section>
    );

  return (
    <section className="rounded-3xl bg-white/70 p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-medium">Telegram</h2>
      {status.linked ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">
            Привязан как <span className="font-mono">@{status.username ?? 'unknown'}</span>
          </p>
          <button
            onClick={async () => {
              await fetch('/api/telegram/unlink', { method: 'POST' });
              await refresh();
            }}
            className="rounded-xl border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5"
          >
            Отвязать
          </button>
        </div>
      ) : linkInfo ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">Открой ссылку и нажми «Start» в боте:</p>
          <a
            href={linkInfo.deepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm text-white"
          >
            Открыть бота
          </a>
          <p className="text-xs text-[var(--color-ink)]/60">Ссылка живёт 10 минут.</p>
        </div>
      ) : (
        <button
          onClick={async () => {
            const r = await fetch('/api/telegram/link-token', { method: 'POST' });
            setLinkInfo(await r.json());
          }}
          className="mt-3 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm text-white"
        >
          Подключить Telegram
        </button>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Sidebar link to /settings**

Edit `apps/web/src/components/layout/Sidebar.tsx` — append a settings entry to the existing nav list (e.g. after the four module links):

```tsx
{ href: '/settings', label: 'Настройки', accent: 'var(--color-ink)' },
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(modules\)/settings apps/web/src/components/layout/Sidebar.tsx
git commit -m "web/settings: page with profile + telegram card"
```

---

### Task 18: Bot consumes link tokens

**Files:**

- Create: `apps/bot/src/services/link-account.ts`
- Modify: `apps/bot/src/handlers/start.ts`
- Modify: `apps/bot/src/env.ts` (already has REDIS_URL via shared lib? — if not, add)
- Modify: `apps/bot/package.json` (add `ioredis` dep — already there)
- Test: `apps/bot/tests/link-account.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/bot/tests/link-account.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const dbWrites: unknown[] = [];

vi.mock('@letget/db/client', () => ({
  createDbClient: () => ({
    db: {
      insert: vi.fn(() => ({
        values: vi.fn(async (v: unknown) => {
          dbWrites.push(v);
        }),
        onConflictDoUpdate: vi.fn(() => ({
          values: async (v: unknown) => {
            dbWrites.push(v);
          },
        })),
      })),
    },
  }),
}));

vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn(async (k: string) => (k === 'tglink:good-token' ? 'user-1' : null)),
    del: vi.fn(async () => 1),
  })),
}));

describe('linkAccountFromToken', () => {
  it('returns linked when token valid', async () => {
    const { linkAccountFromToken } = await import('../src/services/link-account');
    const r = await linkAccountFromToken({
      token: 'good-token',
      telegramId: 42n,
      chatId: 42n,
      username: 'me',
    });
    expect(r.kind).toBe('linked');
  });

  it('returns expired when token unknown', async () => {
    const { linkAccountFromToken } = await import('../src/services/link-account');
    const r = await linkAccountFromToken({
      token: 'bad-token',
      telegramId: 42n,
      chatId: 42n,
      username: 'me',
    });
    expect(r.kind).toBe('expired');
  });
});
```

Run: FAIL.

- [ ] **Step 2: Service**

Create `apps/bot/src/services/link-account.ts`:

```ts
import Redis from 'ioredis';
import { createDbClient } from '@letget/db/client';
import { telegramLinks } from '@letget/db/schema';
import { env } from '../env';

const redis = new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
const { db } = createDbClient();

type Args = { token: string; telegramId: bigint; chatId: bigint; username: string | null };
type Result = { kind: 'linked'; userId: string } | { kind: 'expired' } | { kind: 'conflict' };

export async function linkAccountFromToken(args: Args): Promise<Result> {
  const userId = await redis.get(`tglink:${args.token}`);
  if (!userId) return { kind: 'expired' };

  try {
    await db.insert(telegramLinks).values({
      userId,
      telegramId: args.telegramId,
      chatId: args.chatId,
      username: args.username,
      linkedAt: new Date(),
    });
    await redis.del(`tglink:${args.token}`);
    return { kind: 'linked', userId };
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { kind: 'conflict' };
    }
    throw err;
  }
}
```

- [ ] **Step 3: Wire into /start handler**

Edit `apps/bot/src/handlers/start.ts`:

```ts
import { Composer, type Context } from 'grammy';
import { linkAccountFromToken } from '../services/link-account';
import { logger } from '../logger';

export const startHandler = new Composer();

startHandler.command('start', async (ctx) => {
  const payload = ctx.match?.toString().trim() ?? '';
  if (payload.startsWith('link_')) {
    const token = payload.slice('link_'.length);
    const tg = ctx.from;
    if (!tg) {
      await ctx.reply('Не удалось получить твой ID. Попробуй ещё раз.');
      return;
    }
    const r = await linkAccountFromToken({
      token,
      telegramId: BigInt(tg.id),
      chatId: BigInt(ctx.chat?.id ?? tg.id),
      username: tg.username ?? null,
    });
    if (r.kind === 'linked') {
      await ctx.reply('✅ Telegram привязан. Возвращайся в LETget — там уже видно.');
    } else if (r.kind === 'expired') {
      await ctx.reply('Токен истёк. Сгенерируй новую ссылку в настройках LETget.');
    } else {
      await ctx.reply('Этот Telegram уже привязан к другому аккаунту. Сначала отвяжи его там.');
    }
    return;
  }

  await ctx.reply(
    'Привет! Это бот LETget. Чтобы привязать аккаунт, открой /settings в приложении и нажми «Подключить Telegram».',
  );
  logger.info({ from: ctx.from?.id }, 'start command without payload');
});
```

- [ ] **Step 4: Run + commit**

```bash
pnpm -F @letget/bot vitest run tests/link-account.test.ts
git add apps/bot/src apps/bot/tests
git commit -m "bot: handle /start link_<token> payload"
```

---

## Group F: v1 → v2 migration

> **Context for v1 data shape:** the legacy app stored four namespaces under localStorage keys `letget:tasks`, `letget:shopping`, `letget:code`, `letget:workouts`. Field names from those payloads have to be remapped to v2 schema names. v1 task entries used `text` (plain) + `htmlText` (rich), v1 shopping had `trips` + `items` arrays, v1 code used `title` + `code` + `lang`, v1 workouts had `exercises` + `sets` (with `exerciseId` referring to a v1 string id like "pullups"). Treat all fields as optional in the schema (use `.catch(default)` so a single bad row doesn't fail the whole import).

### Task 19: Zod schema for v1 payload

**Files:**

- Create: `packages/lib/src/zod/migrate.ts`
- Modify: `packages/lib/src/zod/index.ts`
- Modify: `packages/lib/src/index.ts` (re-export)
- Test: `packages/lib/tests/migrate.test.ts`

- [ ] **Step 1: Failing test**

Create `packages/lib/tests/migrate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { v1MigrationSchema } from '../src/zod/migrate';

describe('v1MigrationSchema', () => {
  it('accepts a minimal payload with empty arrays', () => {
    const r = v1MigrationSchema.safeParse({
      tasks: [],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    expect(r.success).toBe(true);
  });

  it('accepts a realistic v1 task entry and falls back on missing fields', () => {
    const r = v1MigrationSchema.safeParse({
      tasks: [
        {
          id: 't1',
          text: 'Купить хлеб',
          htmlText: '<p>Купить хлеб</p>',
          isDone: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
        { id: 't2', text: 'Wax car' }, // missing fields tolerated
      ],
      shopping: {
        trips: [{ id: 'tr1', name: 'Магнит', isCurrent: true, createdAt: '2024-02-01T00:00:00Z' }],
        items: [
          { id: 'i1', tripId: 'tr1', name: 'Молоко', quantity: '1 л', isDone: false, position: 0 },
        ],
      },
      code: [{ id: 'c1', title: 'snippet', code: 'console.log(1)', lang: 'ts' }],
      workouts: {
        exercises: [{ id: 'pullups', name: 'Подтягивания', icon: '💪' }],
        sets: [{ id: 's1', exerciseId: 'pullups', reps: 10, performedAt: '2024-03-01T00:00:00Z' }],
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tasks.length).toBe(2);
      expect(r.data.workouts.exercises[0].name).toBe('Подтягивания');
    }
  });

  it('rejects non-object root', () => {
    expect(v1MigrationSchema.safeParse('garbage').success).toBe(false);
    expect(v1MigrationSchema.safeParse(null).success).toBe(false);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Schema**

Create `packages/lib/src/zod/migrate.ts`:

```ts
import { z } from 'zod';

const isoDate = z.string().datetime().or(z.string().min(1)).optional();
const optionalString = z.string().optional().nullable();

const v1Task = z.object({
  id: z.string(),
  text: z.string().default(''),
  htmlText: z.string().optional(),
  isDone: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  deadline: isoDate,
  doneAt: isoDate,
  createdAt: isoDate,
  updatedAt: isoDate,
});

const v1ShoppingTrip = z.object({
  id: z.string(),
  name: z.string().default('Поход'),
  isCurrent: z.boolean().default(false),
  completedAt: isoDate,
  createdAt: isoDate,
});

const v1ShoppingItem = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  quantity: optionalString,
  isDone: z.boolean().default(false),
  position: z.number().int().default(0),
  doneAt: isoDate,
  createdAt: isoDate,
});

const v1CodeSnippet = z.object({
  id: z.string(),
  title: optionalString,
  code: z.string(),
  lang: optionalString,
  isPinned: z.boolean().default(false),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const v1Exercise = z.object({
  id: z.string(),
  name: z.string(),
  icon: optionalString,
  archivedAt: isoDate,
});

const v1Set = z.object({
  id: z.string(),
  exerciseId: z.string(),
  reps: z.number().int().nonnegative(),
  notes: optionalString,
  performedAt: isoDate,
});

export const v1MigrationSchema = z.object({
  tasks: z.array(v1Task).default([]),
  shopping: z
    .object({
      trips: z.array(v1ShoppingTrip).default([]),
      items: z.array(v1ShoppingItem).default([]),
    })
    .default({ trips: [], items: [] }),
  code: z.array(v1CodeSnippet).default([]),
  workouts: z
    .object({
      exercises: z.array(v1Exercise).default([]),
      sets: z.array(v1Set).default([]),
    })
    .default({ exercises: [], sets: [] }),
});

export type V1MigrationPayload = z.infer<typeof v1MigrationSchema>;
```

- [ ] **Step 3: Re-export**

Edit `packages/lib/src/zod/index.ts`:

```ts
export * from './auth';
export * from './migrate';
```

- [ ] **Step 4: Run + commit**

```bash
pnpm -F @letget/lib vitest run tests/migrate.test.ts
git add packages/lib/src/zod/migrate.ts packages/lib/src/zod/index.ts packages/lib/tests/migrate.test.ts
git commit -m "lib/zod: v1 migration payload schema"
```

---

### Task 20: HTML sanitizer wrapper

**Files:**

- Create: `apps/web/src/lib/sanitize.ts`
- Test: `apps/web/tests/lib/sanitize.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/lib/sanitize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sanitizeHtml, htmlToPlainText } from '../../src/lib/sanitize';

describe('sanitizeHtml', () => {
  it('strips scripts and on-handlers', () => {
    const input = '<p>Hi <script>alert(1)</script> <a href="x" onclick="bad()">link</a></p>';
    const out = sanitizeHtml(input);
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
  });
  it('htmlToPlainText returns text content', () => {
    expect(htmlToPlainText('<p>Hi <b>there</b></p>')).toContain('Hi');
    expect(htmlToPlainText('<p>Hi <b>there</b></p>')).not.toContain('<');
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement**

Create `apps/web/src/lib/sanitize.ts`:

```ts
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'br',
  'ul',
  'ol',
  'li',
  'a',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtml(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/lib/sanitize.test.ts
git add apps/web/src/lib/sanitize.ts apps/web/tests/lib/sanitize.test.ts
git commit -m "web/lib: dompurify-backed sanitize + htmlToPlainText"
```

---

### Task 21: v1 importer with transactional write

**Files:**

- Create: `apps/web/src/lib/migrate/v1.ts`
- Test: `apps/web/tests/migrate/v1.test.ts`

- [ ] **Step 1: Failing test**

Create `apps/web/tests/migrate/v1.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDbClient } from '@letget/db/client';
import {
  users,
  userPreferences,
  tasks,
  shoppingTrips,
  shoppingItems,
  codeSnippets,
  workoutExercises,
  workoutSets,
} from '@letget/db/schema';
import { genId } from '@letget/db/id';
import { importV1 } from '../../src/lib/migrate/v1';

const { db } = createDbClient();

async function makeUser(): Promise<string> {
  const id = genId();
  await db
    .insert(users)
    .values({ id, email: `${id}@test.local`, role: 'user', createdAt: new Date() });
  await db.insert(userPreferences).values({ userId: id });
  return id;
}

describe('importV1', () => {
  it('imports a small payload and returns counts', async () => {
    const userId = await makeUser();
    const result = await importV1(userId, {
      tasks: [{ id: 'old1', text: 'Buy milk', isDone: false }],
      shopping: {
        trips: [{ id: 'tr1', name: 'Магнит', isCurrent: true }],
        items: [{ id: 'i1', tripId: 'tr1', name: 'Молоко', position: 0, isDone: false }],
      },
      code: [{ id: 'c1', code: 'x = 1', lang: 'js', title: 'init' }],
      workouts: {
        exercises: [{ id: 'pullups', name: 'Подтягивания', icon: '💪' }],
        sets: [{ id: 's1', exerciseId: 'pullups', reps: 12 }],
      },
    });
    expect(result.alreadyMigrated).toBe(false);
    expect(result.counts.tasks).toBe(1);
    expect(result.counts.shoppingItems).toBe(1);
    expect(result.counts.codeSnippets).toBe(1);
    expect(result.counts.workoutSets).toBe(1);

    const tRows = await db.select().from(tasks).where(eq(tasks.userId, userId));
    expect(tRows.length).toBe(1);
    const prefRows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    expect(prefRows[0].migratedV1At).not.toBeNull();
  });

  it('is idempotent — second call returns alreadyMigrated', async () => {
    const userId = await makeUser();
    await importV1(userId, {
      tasks: [],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    const second = await importV1(userId, {
      tasks: [{ id: 'late', text: 'should not import' }],
      shopping: { trips: [], items: [] },
      code: [],
      workouts: { exercises: [], sets: [] },
    });
    expect(second.alreadyMigrated).toBe(true);
    const tRows = await db.select().from(tasks).where(eq(tasks.userId, userId));
    expect(tRows.length).toBe(0);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement importer**

Create `apps/web/src/lib/migrate/v1.ts`:

```ts
import { eq } from 'drizzle-orm';
import { createDbClient } from '@letget/db/client';
import {
  userPreferences,
  tasks,
  shoppingTrips,
  shoppingItems,
  codeSnippets,
  workoutExercises,
  workoutSets,
} from '@letget/db/schema';
import { genId } from '@letget/db/id';
import type { V1MigrationPayload } from '@letget/lib/zod/migrate';
import { sanitizeHtml, htmlToPlainText } from '../sanitize';

const { db } = createDbClient();

type Counts = {
  tasks: number;
  shoppingTrips: number;
  shoppingItems: number;
  codeSnippets: number;
  workoutExercises: number;
  workoutSets: number;
};
type ImportResult = { alreadyMigrated: boolean; counts: Counts };

const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function importV1(userId: string, payload: V1MigrationPayload): Promise<ImportResult> {
  return await db.transaction(async (tx) => {
    const prefs = await tx.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    if (prefs.length > 0 && prefs[0].migratedV1At) {
      return {
        alreadyMigrated: true,
        counts: {
          tasks: 0,
          shoppingTrips: 0,
          shoppingItems: 0,
          codeSnippets: 0,
          workoutExercises: 0,
          workoutSets: 0,
        },
      };
    }

    const counts: Counts = {
      tasks: 0,
      shoppingTrips: 0,
      shoppingItems: 0,
      codeSnippets: 0,
      workoutExercises: 0,
      workoutSets: 0,
    };

    // Tasks
    if (payload.tasks.length > 0) {
      const rows = payload.tasks.map((t) => {
        const html = t.htmlText ? sanitizeHtml(t.htmlText) : `<p>${escapeHtml(t.text)}</p>`;
        const text = t.htmlText ? htmlToPlainText(t.htmlText) : t.text;
        return {
          id: genId(),
          userId,
          contentHtml: html,
          contentText: text,
          isDone: t.isDone,
          isPinned: t.isPinned,
          deadline: parseDate(t.deadline ?? null),
          doneAt: parseDate(t.doneAt ?? null),
          createdAt: parseDate(t.createdAt ?? null) ?? new Date(),
          updatedAt: parseDate(t.updatedAt ?? null) ?? new Date(),
        };
      });
      await tx.insert(tasks).values(rows);
      counts.tasks = rows.length;
    }

    // Shopping trips
    const tripIdMap = new Map<string, string>();
    if (payload.shopping.trips.length > 0) {
      const rows = payload.shopping.trips.map((tr) => {
        const newId = genId();
        tripIdMap.set(tr.id, newId);
        return {
          id: newId,
          userId,
          name: tr.name,
          isCurrent: tr.isCurrent,
          completedAt: parseDate(tr.completedAt ?? null),
          createdAt: parseDate(tr.createdAt ?? null) ?? new Date(),
          updatedAt: new Date(),
        };
      });
      await tx.insert(shoppingTrips).values(rows);
      counts.shoppingTrips = rows.length;
    }

    // Shopping items (only those whose tripId we know)
    if (payload.shopping.items.length > 0) {
      const rows = payload.shopping.items
        .filter((it) => tripIdMap.has(it.tripId))
        .map((it) => ({
          id: genId(),
          tripId: tripIdMap.get(it.tripId)!,
          name: it.name,
          quantity: it.quantity ?? null,
          isDone: it.isDone,
          position: it.position,
          doneAt: parseDate(it.doneAt ?? null),
          createdAt: parseDate(it.createdAt ?? null) ?? new Date(),
        }));
      if (rows.length > 0) {
        await tx.insert(shoppingItems).values(rows);
        counts.shoppingItems = rows.length;
      }
    }

    // Code snippets
    if (payload.code.length > 0) {
      const rows = payload.code.map((c) => ({
        id: genId(),
        userId,
        title: c.title ?? null,
        code: c.code,
        language: c.lang ?? null,
        isPinned: c.isPinned,
        createdAt: parseDate(c.createdAt ?? null) ?? new Date(),
        updatedAt: parseDate(c.updatedAt ?? null) ?? new Date(),
      }));
      await tx.insert(codeSnippets).values(rows);
      counts.codeSnippets = rows.length;
    }

    // Workout exercises (with v1id → v2id map for sets)
    const exIdMap = new Map<string, string>();
    if (payload.workouts.exercises.length > 0) {
      const rows = payload.workouts.exercises.map((e) => {
        const newId = genId();
        exIdMap.set(e.id, newId);
        return {
          id: newId,
          userId,
          name: e.name,
          slug: slugify(e.name),
          icon: e.icon ?? null,
          archivedAt: parseDate(e.archivedAt ?? null),
          createdAt: new Date(),
        };
      });
      await tx.insert(workoutExercises).values(rows);
      counts.workoutExercises = rows.length;
    }

    // Workout sets
    if (payload.workouts.sets.length > 0) {
      const rows = payload.workouts.sets
        .filter((s) => exIdMap.has(s.exerciseId))
        .map((s) => ({
          id: genId(),
          userId,
          exerciseId: exIdMap.get(s.exerciseId)!,
          reps: s.reps,
          notes: s.notes ?? null,
          performedAt: parseDate(s.performedAt ?? null) ?? new Date(),
        }));
      if (rows.length > 0) {
        await tx.insert(workoutSets).values(rows);
        counts.workoutSets = rows.length;
      }
    }

    // Mark migrated
    if (prefs.length > 0) {
      await tx
        .update(userPreferences)
        .set({ migratedV1At: new Date(), updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    } else {
      await tx.insert(userPreferences).values({ userId, migratedV1At: new Date() });
    }

    return { alreadyMigrated: false, counts };
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'exercise'
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm -F @letget/web vitest run tests/migrate/v1.test.ts
git add apps/web/src/lib/migrate apps/web/tests/migrate
git commit -m "web/migrate: transactional v1 import with field mapping"
```

---

### Task 22: Migration API endpoint + client trigger

**Files:**

- Create: `apps/web/src/app/api/migrate/v1/route.ts`
- Create: `apps/web/src/components/migration/migrate-listener.tsx`
- Modify: `apps/web/src/app/(modules)/layout.tsx` (mount listener)

- [ ] **Step 1: Route**

Create `apps/web/src/app/api/migrate/v1/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { v1MigrationSchema } from '@letget/lib/zod/migrate';
import { requireUser } from '@/lib/auth/session';
import { importV1 } from '@/lib/migrate/v1';
import { checkLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const user = await requireUser();

  const limit = await checkLimit({ key: `migrate:${user.id}`, max: 1, windowSec: 3600 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = v1MigrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await importV1(user.id, parsed.data);
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Listener (client)**

Create `apps/web/src/components/migration/migrate-listener.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

const STORAGE_FLAG = 'letget:migrated';

function readV1FromLocalStorage() {
  const get = (k: string) => {
    try {
      const raw = localStorage.getItem(`letget:${k}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const tasks = get('tasks') ?? [];
  const shopping = get('shopping') ?? { trips: [], items: [] };
  const code = get('code') ?? [];
  const workouts = get('workouts') ?? { exercises: [], sets: [] };
  const empty =
    Array.isArray(tasks) &&
    tasks.length === 0 &&
    (shopping.trips ?? []).length === 0 &&
    (shopping.items ?? []).length === 0 &&
    Array.isArray(code) &&
    code.length === 0 &&
    (workouts.exercises ?? []).length === 0 &&
    (workouts.sets ?? []).length === 0;
  return empty ? null : { tasks, shopping, code, workouts };
}

export function MigrateListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_FLAG) === '1') return;
    const payload = readV1FromLocalStorage();
    if (!payload) {
      localStorage.setItem(STORAGE_FLAG, '1');
      return;
    }
    void (async () => {
      try {
        const r = await fetch('/api/migrate/v1', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) return;
        const data = (await r.json()) as {
          alreadyMigrated: boolean;
          counts?: Record<string, number>;
        };
        localStorage.setItem(STORAGE_FLAG, '1');
        if (!data.alreadyMigrated && data.counts) {
          const c = data.counts;
          const summary = `Импортировано: ${c.tasks ?? 0} задач, ${c.shoppingTrips ?? 0} походов, ${c.codeSnippets ?? 0} сниппетов, ${c.workoutSets ?? 0} подходов`;
          // Lightweight toast — replace with full toast system in Plan 7
          console.info(summary);
          alert(summary);
        }
      } catch (err) {
        console.warn('migration failed', err);
      }
    })();
  }, []);

  return null;
}
```

- [ ] **Step 3: Mount listener in modules layout**

Edit `apps/web/src/app/(modules)/layout.tsx`. If it doesn't exist yet (modules currently sit directly under `app/`), create it as a passthrough:

```tsx
import type { ReactNode } from 'react';
import { MigrateListener } from '@/components/migration/migrate-listener';

export default function ModulesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MigrateListener />
      {children}
    </>
  );
}
```

> **Note:** if module pages currently live at `app/tasks/page.tsx` etc. (no route group), move them under `app/(modules)/tasks/page.tsx`. This was the structure committed in Plan 1, so most likely already correct — verify with `ls apps/web/src/app`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/migrate apps/web/src/components/migration apps/web/src/app/\(modules\)/layout.tsx
git commit -m "web/migrate: api endpoint + client-side first-login trigger"
```

---

## Group G: End-to-end verification

### Task 23: Update root README with auth flows

**Files:**

- Modify: `README.md`
- Modify: `apps/web/.env.example` (add new vars with empty values)

- [ ] **Step 1: Add env example entries**

Edit `apps/web/.env.example` (create if missing). Append these lines (all values empty by design):

```
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3040
RESEND_API_KEY=
ADMIN_EMAIL=
TELEGRAM_BOT_USERNAME=letget_bot
```

- [ ] **Step 2: README addition**

Edit `README.md` — add a new section "Auth setup (local dev)":

```markdown
### Auth setup (local dev)

1. Generate a session secret: `openssl rand -hex 32` → put into `apps/web/.env.local` as `BETTER_AUTH_SECRET=<value>`.
2. Set `BETTER_AUTH_URL=http://localhost:3040`.
3. Leave `RESEND_API_KEY` empty — emails will print to the dev console (no real send).
4. Set `ADMIN_EMAIL=<your-email>` if you want first registration with that email to become admin.
5. Restart `pnpm dev`.

### v1 → v2 migration

When a user first signs in, the modules layout mounts `<MigrateListener>` which reads `letget:*` keys from `localStorage` and POSTs them to `/api/migrate/v1`. The server is idempotent: a second call returns `{alreadyMigrated: true}` regardless of payload, so cross-device runs are safe.

### Telegram link (dev)

1. `TELEGRAM_BOT_TOKEN` set in `apps/bot/.env.local` (otherwise bot starts in disabled mode).
2. Start the bot in long polling mode: `TELEGRAM_USE_LONG_POLLING=1 pnpm -F @letget/bot dev`.
3. Open `/settings` → "Подключить Telegram" → click the deep link → bot replies "✅ Telegram привязан" → `/settings` polling picks up the change.
```

- [ ] **Step 3: Commit**

```bash
git add README.md apps/web/.env.example
git commit -m "docs: auth + migration setup notes"
```

---

### Task 24: Full smoke + tag `auth-complete`

**Files:** none.

- [ ] **Step 1: Run the full pipeline**

```bash
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm -F @letget/web build
```

Expected: all green. If anything fails, fix in place (do not commit failing state); add the fix to the appropriate task's commit history.

- [ ] **Step 2: Manual smoke (web)**

Start both processes side-by-side:

```bash
pnpm db:up
pnpm -F @letget/web dev   # :3040
pnpm -F @letget/bot dev   # :3041 (or with TELEGRAM_USE_LONG_POLLING=1 pointing to a real bot)
```

Walk through:

1. Open `http://localhost:3040` → should redirect to `/sign-in`.
2. Click "Создать аккаунт" → fill form with the email matching `ADMIN_EMAIL` → submit → redirect to `/verify-email/sent`.
3. Watch the web dev console — the `[email:dev-stub]` log line contains the verification URL. Open it.
4. After verification, log in → land on `/tasks`.
5. Open `/settings` — name/email/role visible. Role should be `admin` if the email matched.
6. Click "Подключить Telegram" — opens deep link. In the bot chat, click `Start` → bot replies "✅ Telegram привязан" → settings polling refreshes within ~3s and shows "@username".
7. Log out → `/sign-in` page. Log in again → still works, no second migration trigger.
8. Open browser devtools → run `localStorage.setItem('letget:tasks', JSON.stringify([{id:'x',text:'imported'}]))` then `localStorage.removeItem('letget:migrated')` → reload → see toast "Импортировано: 1 задач, …" and check the task is in the DB via `pnpm db:studio`.

- [ ] **Step 3: Tag**

Once smoke passes:

```bash
git tag auth-complete -m "Plan 2 complete: auth + telegram link + v1 migration"
git log --oneline rebuild/phase-1 | head -40
```

- [ ] **Step 4: (Optional) push**

```bash
# Only if user explicitly authorises pushing
git push origin rebuild/phase-1
git push origin auth-complete
```

---

## Self-Review

**Spec coverage check** (against `docs/superpowers/specs/2026-04-28-letget-rebuild-design.md` sections 4.1, 4.2, 4.3, 5.1–5.5, 13):

| Spec requirement                                              | Covered by                |
| ------------------------------------------------------------- | ------------------------- |
| §5.1 sign-up + verify                                         | Tasks 8–10                |
| §5.1 ADMIN_EMAIL → role admin                                 | Task 8 (`role-policy.ts`) |
| §5.2 sign-in + login_history + rate limit                     | Tasks 11–12               |
| §5.2 forgot/reset password                                    | Task 13                   |
| §5.3 Telegram link with linkToken in Redis (10 min)           | Tasks 15–18               |
| §5.5 v1 migration with idempotency via `migratedV1At`         | Tasks 19–22               |
| §13 bcrypt cost 12, sessions in Postgres                      | Task 2                    |
| §13 rate limit `/api/auth/*` 5/15min, `/api/migrate/*` 1/hour | Tasks 7, 12, 22           |
| §13 Zod on every endpoint                                     | Tasks 8, 12, 13, 19, 22   |
| §13 DOMPurify server-side for rich-text                       | Task 20                   |
| `user_preferences` row created at signup with default theme   | **Gap** (see below)       |

**Spec gap found:** §5.1 implies `user_preferences` is seeded for every user, but the plan doesn't explicitly create that row at signup time — the importer in Task 21 only inserts it as a fallback. **Fix:** the `databaseHooks.user.create.before` hook in Task 8 should be extended with a `databaseHooks.user.create.after` hook that inserts `user_preferences` (id=user.id, defaults). This is a one-line addition. Apply it as part of Task 8 step 3:

Append to the `betterAuth({...})` config in Task 8:

```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => ({
        data: { ...user, role: resolveRoleForEmail(user.email) },
      }),
      after: async (user) => {
        const { db: hookDb } = (await import('@letget/db/client')).createDbClient();
        const { userPreferences } = await import('@letget/db/schema');
        await hookDb.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
      },
    },
  },
},
```

Add a test in Task 8 step 1 that asserts `user_preferences` row exists after signup.

**Placeholder scan:** none of the tasks contain `TODO`, `TBD`, `implement later`, or "similar to Task N". Each step has the actual code.

**Type consistency check:**

- `recordLoginAttempt` field names match `loginHistory` schema columns (Task 11 vs spec §4.3) ✅
- `linkAccountFromToken` fields match `telegramLinks` columns (`userId`, `telegramId`, `chatId`, `username`, `linkedAt`) ✅
- `importV1` field names match v2 schema (`contentHtml`, `contentText`, `isPinned`, `searchVector` is generated so not inserted) ✅
- `auth.api.signInEmail` / `signUpEmail` / `forgetPassword` / `resetPassword` — Better Auth method names. **Note for implementer:** if a Better Auth version mismatch surfaces a different name (e.g. `forgotPassword`), align to whatever the installed version actually exports. The test mocks should catch this on first run.

**Open implementer questions** (raise these up if you hit ambiguity):

1. Better Auth API method naming has shifted between releases — check the installed `node_modules/better-auth/dist/.../api.d.ts` if any of the `auth.api.*` calls fail.
2. `databaseHooks` may not exist on older Better Auth versions; `signUp.before` plugin alternative may be required.
3. If `requireEmailVerification: true` blocks first-time sign-up flow with auto-redirect, switch the action to return `{requireVerify: true}` and let the form route to `/verify-email/sent` manually.

---

## Implementation handoff

Plan saved to `docs/superpowers/plans/2026-04-29-auth-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review (spec compliance + code quality) between tasks.

**2. Inline Execution** — Use `superpowers:executing-plans` to batch-execute in this session with periodic checkpoints.

Same convention as Plan 1: branch `rebuild/phase-1` continues, commits per task, final tag `auth-complete`.
