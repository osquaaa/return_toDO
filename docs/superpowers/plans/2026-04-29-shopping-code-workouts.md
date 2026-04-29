# Shopping + Code + Workouts Implementation Plan

> Concise plan format. Three modules, each compact (no rich-text editor) but with module-specific UX. Pattern is the same as Plan 3: zod → queries → mutations → actions → api → ui.

**Goal:** Implement remaining 3 Phase 1 modules.

**Architecture:** Same as Tasks — server-action mutations + API for client fetch.

---

## Module 1 (Shopping) — Tasks 1-4

### Task 1: Shopping queries + mutations

**Files:**

- Create: `packages/lib/src/zod/shopping.ts`
  - `addItemSchema { name, quantity? }`, `updateItemSchema { name?, quantity?, isDone? }`, `reorderSchema { items: [{id, position}] }`, `createTripSchema { name? }`
- Create: `apps/web/src/lib/shopping/queries.ts`
  - `getCurrentTrip(userId) → Trip | null`
  - `listTripsHistory(userId, limit) → Trip[]`
  - `listItems(tripId) → Item[] (ORDER BY position)`
  - `listItemSuggestions(userId, limit=20) → string[]` — distinct names from past items, most recent first
- Create: `apps/web/src/lib/shopping/mutations.ts`
  - `startNewTrip(userId, name?)` — UPDATE existing isCurrent=true → false (with completedAt=now), then INSERT new with isCurrent=true
  - `addItem(userId, tripId, input)` — verify trip belongs to user, insert with position=max+1
  - `toggleItem(userId, itemId)` — verify ownership via trip
  - `updateItem(userId, itemId, input)`
  - `deleteItem(userId, itemId)`
  - `reorderItems(userId, tripId, items)` — bulk update positions
  - `completeTrip(userId, tripId)` — set isCurrent=false, completedAt=now
  - `repeatTrip(userId, tripId)` — start new trip, copy items from old (uncompleted only)

Tests: real DB seeded, ownership checks, partial unique on isCurrent enforced.

Commits: 2 (zod, then queries+mutations together).

### Task 2: Shopping actions + API

**Files:**

- Create: `apps/web/src/app/(modules)/shopping/actions.ts` — wraps each mutation, calls revalidatePath('/shopping')
- Create: `apps/web/src/app/api/shopping/current/route.ts` — GET returns current trip + items
- Create: `apps/web/src/app/api/shopping/items/route.ts` — POST add item

Commit: `web/shopping: actions + api`.

### Task 3: Shopping UI

**Files:**

- Modify: `apps/web/src/app/(modules)/shopping/page.tsx` (replace placeholder)
- Create: `apps/web/src/app/(modules)/shopping/active-trip.tsx` (client) — composer + items list
- Create: `apps/web/src/app/(modules)/shopping/item-row.tsx` (client) — one item with checkbox + qty + drag-handle
- Create: `apps/web/src/app/(modules)/shopping/history-panel.tsx` (client) — past trips with "повторить" button
- Create: `apps/web/src/app/(modules)/shopping/composer.tsx` (client) — name + qty inputs + datalist suggestions

Behavior:

- Page is server: loads current trip + items + history + suggestions, passes to client
- Composer with 2 inputs (name, qty), Enter to add. Datalist driven by `listItemSuggestions`.
- Items list: checkbox toggles done. Click name → inline edit. Drag handle reorders (use `react-beautiful-dnd` or simpler: just up/down buttons for now — easier to implement, no extra dep).
- "Завершить поход" button at bottom of active trip → confirm → completeTrip.
- "Повторить" on a history trip card → repeatTrip.
- "Копировать список" → markdown to clipboard.
- If no current trip exists, show "Начать новый поход" button → startNewTrip.

UX accent: shopping module color is `--color-shopping-from / --color-shopping-to`.

Commit: `web/shopping: full ui`

### Task 4: Shopping smoke

Manual:

1. /shopping → "Начать новый поход" if empty
2. Add 3 items with quantities
3. Toggle 1 → strikethrough
4. Reorder via up/down
5. Complete trip → goes to history
6. "Повторить" → new active trip with same items (uncompleted)

Commit: none (smoke only).

---

## Module 2 (Code) — Tasks 5-7

### Task 5: Code queries + mutations + zod

**Files:**

- Create: `packages/lib/src/zod/code.ts`
  - `createSnippetSchema { code, title?, language? }`
  - `updateSnippetSchema { code?, title?, language?, isPinned? }`
  - `listSnippetsQuerySchema { q?, pinned? }`
- Create: `apps/web/src/lib/code/queries.ts`
  - `listSnippets(userId, opts: { q?, pinned? })` — filter by tsvector if q
  - `getSnippet(userId, id)`
- Create: `apps/web/src/lib/code/mutations.ts`
  - `createSnippet(userId, input)` — sanitize? NO (code is plaintext, not HTML; Drizzle parameterizes the insert)
  - `updateSnippet(userId, id, input)`
  - `softDeleteSnippet(userId, id)`

Test: ownership, search.

Commits: 2 (zod, queries+mutations).

### Task 6: Code actions + API + UI

**Files:**

- Create: `apps/web/src/app/(modules)/code/actions.ts` — same shape as tasks
- Create: `apps/web/src/app/api/code/route.ts` (GET, POST), `apps/web/src/app/api/code/[id]/route.ts` (PATCH, DELETE)
- Modify: `apps/web/src/app/(modules)/code/page.tsx`
- Create: `apps/web/src/app/(modules)/code/snippet-list.tsx`, `snippet-card.tsx`, `composer.tsx`

Behavior:

- Composer: textarea (monospace) + optional title + lang select (or "auto")
- Each snippet card: title (or first line if no title) + language badge + first 5 lines preview + "Copy" + "Edit" + "Pin" + "Delete"
- Click card → expand to show full code with syntax highlighting
- Use `highlight.js` (already a known choice from spec) — install lightweight: `pnpm -F @letget/web add highlight.js`

UX accent: `--color-code-from / --color-code-to`.

Commit: `web/code: actions + api + ui`

### Task 7: Code smoke + commit

Manual smoke + tag.

---

## Module 3 (Workouts) — Tasks 8-11

### Task 8: Workouts queries + mutations + zod

**Files:**

- Create: `packages/lib/src/zod/workouts.ts`
  - `addExerciseSchema { name, slug?, icon? }`, `addSetSchema { exerciseId, reps, notes? }`, `removeSetSchema { id }`
- Create: `apps/web/src/lib/workouts/queries.ts`
  - `listExercises(userId)` — exclude archived
  - `listSetsForToday(userId)` — WHERE performedAt >= start of today
  - `listSetsForRange(userId, fromDate, toDate)`
  - `summary(userId)` — total reps all-time, last 7 days, by exercise (group by)
- Create: `apps/web/src/lib/workouts/mutations.ts`
  - `addExercise(userId, input)` — auto-slugify if not provided
  - `archiveExercise(userId, id)` — set archivedAt
  - `addSet(userId, input)` — verify exercise ownership
  - `removeSet(userId, id)`
  - `clearTodaySets(userId)` — DELETE sets where performedAt today
- **Seed:** at user signup time (Plan 2 Task 8 hook `after`) add seed exercises. **For this plan**, add a separate `seedDefaultExercises(userId)` function and call it from a guarded place. Simplest: add to the existing Plan 2 `databaseHooks.user.create.after` hook in `apps/web/src/lib/auth/auth.ts`.

Tests: ownership, archive doesn't delete, clearTodaySets bound by date.

Commits: 2.

### Task 9: Workouts actions + API + UI

**Files:**

- Create: `apps/web/src/app/(modules)/workouts/actions.ts`
- Modify: `apps/web/src/app/(modules)/workouts/page.tsx`
- Create: `apps/web/src/app/(modules)/workouts/exercise-tabs.tsx`, `set-counter.tsx` (the inc/dec input), `summary-card.tsx`, `heatmap.tsx`

Behavior:

- Tabs of exercises (with icons). + button to add custom.
- Each tab: large counter (− / value / +), "Добавить подход" button → addSet.
- Sets-today list under counter — last 5 with reps + time + delete.
- Below: summary-card with all-time + 7d totals.
- Below that: heatmap-style 14-day calendar (count of sets per day per exercise — color intensity).
- "Сбросить сегодня" link → confirm → clearTodaySets.

UX accent: `--color-workout-from / --color-workout-to`.

Commit: `web/workouts: actions + api + ui`

### Task 10: Smoke + tag

Manual smoke + `git tag plan4-complete`.

---

## Summary commits target

~10-12 commits total across the 3 modules.
