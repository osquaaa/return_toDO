# Admin Panel Implementation Plan

> Concise. Builds admin section with 7 functional pages. The 8 Phase 1 admin sections from spec, minus "Telegram bot status" and "Backups" (deferred to Phase 1.5 since they need infra not yet in place).

**Goal:** `/admin/*` route group with auth-protected admin-only pages: Dashboard, Users, User profile, Content search, Notifications queue, Audit log, Login history, System health.

**Architecture:**

- Route group `(admin)` with shared `layout.tsx` calling `requireAdmin()` (already exists in session.ts) — ensures non-admin users redirect.
- Middleware in `middleware.ts` adds `/admin/*` prefix protection (cookie check at edge).
- Every admin mutation wraps via `withAdminAudit({ action, targetType, targetId, metadata })` decorator that logs to `admin_audit_log`.
- Sensitive actions (delete_user, force_logout, role-change, wipe-data) require a confirm-phrase modal.

---

## Task 1: Admin guard + audit log writer

**Files:**

- Modify: `apps/web/src/middleware.ts` — already lets through cookie check, add explicit `/admin/*` redirect to /sign-in if no cookie (already there since /admin starts after public prefixes)
- Create: `apps/web/src/lib/admin/audit.ts` — `logAdminAction({ adminUserId, action, targetType?, targetId?, metadata?, ipAddress?, userAgent? })`
- Create: `apps/web/src/lib/admin/guard.ts` — `requireAdminContext()` returns `{ user, ipAddress, userAgent }` (calls `requireAdmin` then reads headers)
- Test: `apps/web/tests/admin/audit.test.ts`

```ts
// audit.ts
import { createDbClient } from '@letget/db/client';
import { genId } from '@letget/db';
import { adminAuditLog } from '@letget/db/schema';

const { db } = createDbClient();

type Args = {
  adminUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(args: Args) {
  await db.insert(adminAuditLog).values({
    id: genId(),
    adminUserId: args.adminUserId,
    action: args.action,
    targetType: args.targetType ?? null,
    targetId: args.targetId ?? null,
    metadata: args.metadata ?? null,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
  });
}
```

Commit: `web/admin: audit log writer + guard helper`

---

## Task 2: Admin layout + dashboard

**Files:**

- Create: `apps/web/src/app/(admin)/layout.tsx` — calls `requireAdmin()`, renders sidebar with admin nav links
- Create: `apps/web/src/app/(admin)/admin/page.tsx` — dashboard with metrics
- Create: `apps/web/src/lib/admin/metrics.ts` — `getDashboardMetrics(period: '24h' | '7d' | '30d')`

Metrics queries (use SQL directly):

- totalUsers — `count(users)`
- newUsers — `count WHERE created_at >= now() - interval`
- DAU/WAU/MAU — distinct userId from login_history with success=true in 1d/7d/30d
- pushDeliveryRate — `count WHERE sentAt IS NOT NULL` / total in period
- failedPushes — `count WHERE attempts >= 5 AND sentAt IS NULL`
- moduleActivity — count of inserts per module (tasks/shoppingItems/codeSnippets/workoutSets) in period

UI: simple grid of stat cards. Period selector at top (segmented control). Updates URL `?period=7d`.

Note: `(admin)` route group is SIBLING to `(modules)`. Default route after sign-in goes to `/tasks`. To navigate to admin, add a "Админ" link in `Topbar.tsx` shown only if `user.role === 'admin'`.

Commit: `web/admin: layout + dashboard with metrics`

---

## Task 3: Users list + profile

**Files:**

- Create: `apps/web/src/app/(admin)/admin/users/page.tsx` — paginated user list
- Create: `apps/web/src/app/(admin)/admin/users/[id]/page.tsx` — user profile
- Create: `apps/web/src/app/(admin)/admin/users/[id]/actions.ts` — server actions
- Create: `apps/web/src/lib/admin/users.ts` — queries

Queries:

- `listAdminUsers({ search?, page, limit })` — JOIN users + telegramLinks LEFT, with subqueries for tasks/sets/snippets/trips counts. Use `COUNT(*) FILTER` or correlated subqueries.
- `getAdminUserDetail(id)` — full user + prefs + telegramLink + lastLogin (from login_history) + counts per module + active sessions count
- `getUserLoginHistory(id, limit=50)` — recent login attempts

Actions:

- `forceLogoutAction(userId)` — DELETE all sessions for user. logAdminAction({ action: 'force_logout' }).
- `updateUserRoleAction(userId, role)` — UPDATE users.role. logAdminAction.
- `softDeleteUserAction(userId, confirmPhrase)` — verify confirmPhrase matches `DELETE <email>`, set `deletedAt` (need to add column? — actually users table doesn't have deletedAt in schema; use a different mechanism: archive row by setting email to `deleted-${id}@deleted.local` and clearing personal data). For Phase 1, simpler: implement as full DELETE with CASCADE — relies on FK constraints to clean up.

UI:

- /admin/users — search input, table with pagination (20/page).
- /admin/users/[id] — profile card with all data, "Действия" panel with confirm-modal for sensitive ops.

Commit: `web/admin: users list + profile + actions`

---

## Task 4: Content search + Notifications + Audit log + Login history

Smaller pages, batch into one task with one commit per page.

### 4a: Content search

**File:** `apps/web/src/app/(admin)/admin/content/page.tsx`

Server component reads `?q=...&module=tasks&user=...&period=7d` from searchParams. Calls `searchAllContent(q, filters)` from `apps/web/src/lib/admin/content.ts`.

Query: UNION across `tasks` (where searchVector matches q), `codeSnippets` (similar), `shoppingItems` (LIKE name). LIMIT 100.

Read-only listing. Each row: module + user (email) + content snippet + createdAt. Action: "View" (links to user profile).

### 4b: Notifications queue

**File:** `apps/web/src/app/(admin)/admin/notifications/page.tsx`

Tabs: pending / sent / failed (attempts >= 5 AND sentAt IS NULL).
Pagination. Action: "Manual retry" (resets attempts to 0, scheduledFor=now), "Cancel pending" (sets sentAt=now without delivery).

### 4c: Audit log

**File:** `apps/web/src/app/(admin)/admin/audit/page.tsx`

Read-only. Filters: admin (search by email), action, period. Pagination.

### 4d: Login history

**File:** `apps/web/src/app/(admin)/admin/logins/page.tsx`

Filters: success/fail, email search, period. Highlight rows with: 5+ fails from same IP within an hour (suspicious).

Commit: `web/admin: content + notifications + audit + login history pages` (single commit, all 4 pages plus their query libs)

---

## Task 5: System health page

**File:** `apps/web/src/app/(admin)/admin/health/page.tsx`

Server component:

- DB ping: `db.execute(sql\`SELECT 1\`)` — measure latency
- Redis ping: `redis.ping()` — measure latency
- DB size: `pg_database_size(current_database())`
- Active sessions count: `SELECT COUNT(*) FROM sessions WHERE expiresAt > now()`
- Process info: `process.memoryUsage()`, `process.uptime()`
- Disk: `import os from 'node:os'; os.freemem()` (system memory, not disk — disk requires native syscalls; skip for now or use `df` shell-out)

Display as a panel of cards. No actions.

Commit: `web/admin: system health page`

---

## Task 6: Verify + tag

```bash
pnpm -r typecheck
pnpm -r test
pnpm -F @letget/web build
```

Tag: `git tag plan6-complete -m "Plan 6 done: admin panel"`.

---

## Conventions

- All admin pages start with `const ctx = await requireAdminContext()` (or a layout wrapper if cleaner).
- Every action calls `logAdminAction(...)` BEFORE the mutation, with adminUserId from ctx.user.id.
- Confirmation-phrase modal: simple Tailwind modal with text input, requires exact-match before button enables.
- Pagination via `page=N&limit=20` URL params, server-rendered.
- No client-side state for filters — they live in URL searchParams. Keeps things simple and shareable.
