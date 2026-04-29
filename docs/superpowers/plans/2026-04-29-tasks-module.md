# LETget Tasks Module Implementation Plan

> **Concise plan format.** Each task lists files + acceptance criteria + key code shapes. Implementer fills in details following existing project patterns (Better Auth session via `requireUser`, Drizzle queries, server actions, Tailwind tokens from `globals.css`).

**Goal:** Full CRUD on tasks with rich-text editor, filters, search, deadlines, pin/unpin, bulk actions, soft-delete.

**Architecture:** Server actions for mutations (RSC-friendly), API route for client-side fetching/search. Rich text via TipTap (best-in-class React editor). Sanitize HTML server-side with `sanitizeHtml` from Plan 2. Search via existing `searchVector` GIN index.

**Tech additions:** `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder` for the editor.

---

## File structure

```
apps/web/src/
  app/(modules)/tasks/
    page.tsx                       — server component, lists tasks with filters
    task-list.tsx                  — client list view
    task-item.tsx                  — single row with checkbox/edit/delete actions
    task-editor.tsx                — TipTap rich-text editor (modal create/edit)
    task-filters.tsx               — All / Active / Done + search bar
    task-bulk-bar.tsx              — appears when items selected
    actions.ts                     — server actions: create, update, toggleDone, togglePin, softDelete, bulkUpdate
  app/api/tasks/
    route.ts                       — GET list (filtered/searched), POST create
    [id]/route.ts                  — PATCH update, DELETE soft-delete
  lib/tasks/
    queries.ts                     — read-side functions (listTasks, getTask, searchTasks)
    mutations.ts                   — write-side (createTask, updateTask, etc.)

apps/web/tests/tasks/
  queries.test.ts                  — listTasks, search, filter combinations
  mutations.test.ts                — create, update, soft-delete, pin
  actions.test.ts                  — server actions: input validation, auth, ownership

packages/lib/src/zod/
  tasks.ts                         — createTaskSchema, updateTaskSchema, listTasksQuerySchema
```

---

## Task 1: Zod schemas for tasks

**File:** `packages/lib/src/zod/tasks.ts` + test in `packages/lib/tests/tasks-zod.test.ts`

```ts
import { z } from 'zod';

export const createTaskSchema = z.object({
  contentHtml: z.string().min(1).max(50_000),
  isPinned: z.boolean().default(false),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  contentHtml: z.string().min(1).max(50_000).optional(),
  isDone: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  deadline: z.string().datetime().optional().nullable(),
});

export const listTasksQuerySchema = z.object({
  filter: z.enum(['all', 'active', 'done']).default('active'),
  q: z.string().max(200).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
```

Re-export from `packages/lib/src/zod/index.ts`. Add to package.json exports.

Tests cover: createTaskSchema rejects empty html, accepts deadline, listTasksQuerySchema defaults filter='active'.

Commit: `lib/zod: tasks input schemas`

---

## Task 2: DB queries (read side)

**File:** `apps/web/src/lib/tasks/queries.ts` + test

Functions:

```ts
listTasks(userId, opts: { filter, q }) → Task[]
  - WHERE userId = ? AND deletedAt IS NULL
  - filter: 'active' adds isDone=false; 'done' adds isDone=true; 'all' no extra filter
  - q: WHERE searchVector @@ websearch_to_tsquery('russian', q)
  - ORDER BY isPinned DESC, deadline NULLS LAST, createdAt DESC

getTask(userId, taskId) → Task | null
  - userId check enforces ownership
```

Use Drizzle's `sql` template tag for tsvector match:

```ts
import { sql, and, eq, isNull, desc, asc } from 'drizzle-orm';
const matches = sql`${tasks.searchVector} @@ websearch_to_tsquery('russian', ${q})`;
```

Test seeds 3 tasks with different states, verifies filter + search behavior.

Commit: `web/tasks: queries with filter + tsvector search`

---

## Task 3: DB mutations (write side)

**File:** `apps/web/src/lib/tasks/mutations.ts` + test

Functions:

```ts
createTask(userId, input: CreateTaskInput) → Task
  - sanitize contentHtml via sanitizeHtml
  - derive contentText via htmlToPlainText
  - insert with genId

updateTask(userId, taskId, input: UpdateTaskInput) → Task
  - ownership check (return null if not owned)
  - if contentHtml present: re-sanitize + re-derive contentText
  - if isDone changing to true: set doneAt = now(); if false: clear doneAt
  - update updatedAt = now()

softDeleteTask(userId, taskId) → boolean
  - set deletedAt = now() if owned

bulkUpdate(userId, ids: string[], action: 'done' | 'undone' | 'delete') → number
  - WHERE userId AND id IN (?) AND deletedAt IS NULL
  - returns affected count
```

Tests cover: ownership enforcement, content sanitization (XSS), pin limit (NO — UX-only per spec, not DB).

Commit: `web/tasks: mutations with ownership + sanitization`

---

## Task 4: Server actions

**File:** `apps/web/src/app/(modules)/tasks/actions.ts` + test

Wrap mutations with:

- `requireUser()` for auth
- Zod parse for input
- `revalidatePath('/tasks')` after mutation

```ts
'use server';
export async function createTaskAction(input: unknown) { ... }
export async function updateTaskAction(taskId: string, input: unknown) { ... }
export async function toggleDoneAction(taskId: string) { ... }
export async function togglePinAction(taskId: string) { ... }
export async function deleteTaskAction(taskId: string) { ... }
export async function bulkAction(ids: string[], action: 'done' | 'undone' | 'delete') { ... }
```

Each returns `{ ok: true, data? } | { ok: false, error }`.

Tests with vi.mock of mutations + auth.

Commit: `web/tasks: server actions wrapping mutations`

---

## Task 5: API routes (for client-side ops)

**Files:**

- `apps/web/src/app/api/tasks/route.ts` — GET list, POST create
- `apps/web/src/app/api/tasks/[id]/route.ts` — PATCH update, DELETE soft-delete

Same Zod validation. Used by client for live search (debounced) where server actions aren't suitable.

```ts
// GET /api/tasks?filter=active&q=пиво
export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const parsed = listTasksQuerySchema.safeParse({
    filter: url.searchParams.get('filter') ?? 'active',
    q: url.searchParams.get('q') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const data = await listTasks(user.id, parsed.data);
  return NextResponse.json({ tasks: data });
}
```

No tests (auth-gated trivial wrappers, covered by E2E later).

Commit: `web/tasks: api routes for list + crud`

---

## Task 6: TipTap editor

**Install deps:**

```bash
pnpm -F @letget/web add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

**File:** `apps/web/src/app/(modules)/tasks/task-editor.tsx`

Client component with TipTap. Toolbar: bold, italic, underline, list-bullet, list-ordered, link.

```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export function TaskEditor({ initialHtml, onSubmit, onCancel }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Что нужно сделать?' }),
    ],
    content: initialHtml ?? '',
  });
  // ... toolbar, deadline picker, submit button
}
```

Style buttons with the design tokens (`bg-[var(--color-ink)]` etc.).

Commit: `web/tasks: tiptap editor with toolbar + deadline`

---

## Task 7: Tasks page + list + item

**Files:**

- `apps/web/src/app/(modules)/tasks/page.tsx` — server, reads searchParams, calls listTasks, passes to client
- `apps/web/src/app/(modules)/tasks/task-list.tsx` — client, hosts state + selection
- `apps/web/src/app/(modules)/tasks/task-item.tsx` — client, single row
- `apps/web/src/app/(modules)/tasks/task-filters.tsx` — client, filter buttons + search input
- `apps/web/src/app/(modules)/tasks/task-bulk-bar.tsx` — client, sticky bottom bar when selected.length > 0

Replace the existing `apps/web/src/app/(modules)/tasks/page.tsx` placeholder with full implementation.

Behavior:

- Page reads `?filter=...&q=...` from searchParams
- list rendering with checkboxes
- click row → opens edit modal (TaskEditor)
- pin icon → toggle
- swipe-or-button delete → softDelete
- footer counts: "2 done / 5 total" with clear-completed button
- search debounced 300ms, updates URL via `useRouter().replace()`
- bulk mode: long-press / "Select" toggles selection; bottom bar appears with count + actions

UX accent: tasks module color is `--color-tasks-from / --color-tasks-to`. Pinned items have brand gradient border or top accent line.

Commit: `web/tasks: full ui with filters search bulk-actions`

---

## Task 8: Verify + tag

```bash
pnpm -r typecheck
pnpm -r test
pnpm -F @letget/web build  # may need env vars
```

Smoke (manual):

1. /sign-in → /tasks page loads
2. Create task with rich text → appears in list, pinned-first
3. Set deadline → shows formatted date
4. Toggle done → moves to done filter
5. Search Russian word → tsvector search works
6. Bulk select 3 → mark done → count updates

Tag: `git tag tasks-complete -m "Plan 3 done"`

Commit: `tag` (no commit needed — tag only).
