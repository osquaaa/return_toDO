# Telegram Bot Implementation Plan

> Concise. Builds push delivery, cron jobs, more commands on top of the existing bot skeleton from Plan 1 (Fastify + grammY + linkAccountFromToken).

**Goal:** Bot that delivers push notifications from `notifications_queue`, supports `/today /add /done /help` commands, runs cron jobs for morning digest + weekly recap.

**Architecture:** node-cron schedules in `apps/bot/src/cron.ts` started by main. Push pickup runs every minute. grammY context-based command handlers. Inline callback queries handled with prefix routing.

---

## Task 1: notification_prefs upsert helper + zod

**Files:**

- Create: `packages/lib/src/zod/notifications.ts` — schemas for `setNotificationPrefSchema { eventType, enabled, channel?, timeOfDay?, minutesBefore? }`
- Create: `apps/web/src/lib/notifications/prefs.ts` — `upsertNotificationPref(userId, input)`, `listNotificationPrefs(userId)`, `getPref(userId, eventType)`
- Test: `apps/web/tests/notifications/prefs.test.ts`

EventType enum (matches DB): `morning_digest | task_deadline | workout_streak_warn | weekly_recap | custom_reminder`.

Commit: `lib/zod + web: notification prefs api`

---

## Task 2: notifications_queue insert helpers

**Files:**

- Create: `apps/web/src/lib/notifications/queue.ts`:
  - `enqueueNotification({ userId, eventType, payload, scheduledFor })` — INSERT into `notifications_queue`
  - `pickupDueNotifications(limit=50)` — SELECT \* WHERE sentAt IS NULL AND scheduledFor <= now() AND attempts < 5 ORDER BY scheduledFor LIMIT
  - `markSent(id)`, `markFailed(id, error)` — bumps attempts and sets backoff
- Test: `apps/web/tests/notifications/queue.test.ts`

`markFailed` logic: `attempts += 1`, `scheduledFor = now() + 60 * attempts seconds`, `lastError = error`.

Commit: `web: notifications_queue helpers`

---

## Task 3: Wire task creation to enqueue task_deadline

**File:** Modify `apps/web/src/lib/tasks/mutations.ts`:

- After successful `createTask` and `updateTask` (when deadline changes), check user's `task_deadline` notification pref. If enabled with `minutesBefore`, enqueue a `task_deadline` notification with payload `{ taskId, summary }` scheduled at `deadline - minutesBefore`.
- Helper: `scheduleTaskDeadlineNotification(userId, task)` in `apps/web/src/lib/notifications/scheduler.ts`.

Behavior:

- If task has no deadline, skip.
- If pref doesn't exist or `enabled=false`, skip.
- If updating, first delete existing pending `task_deadline` notification for this taskId (DELETE WHERE userId+eventType+payload->>'taskId'=taskId AND sentAt IS NULL).

Test: real DB with stub user pref enabled.

Commit: `web/tasks: enqueue task_deadline notifications on create/update`

---

## Task 4: Bot push delivery + cron pickup

**Files:**

- Create: `apps/bot/src/services/push.ts`:
  - `deliverNotification(notification)` — looks up user's chatId via `telegram_links`, builds message based on eventType, sends via grammY, returns success/error
  - For `task_deadline`: load task fresh, skip if isDone || deletedAt, message "⏰ Дедлайн через N минут: <text>" with inline buttons [✅ Готово (`done_<taskId>`)] [📅 +1 час (`snooze_<taskId>_60`)]
  - For `morning_digest`: load tasks for today (deadline today + active), build markdown summary
  - For `weekly_recap`: load completed tasks last 7 days + total counts
- Create: `apps/bot/src/cron.ts`:
  - `startCron(bot)` — registers all cron jobs
  - Job 1 (every minute): `pickupDueNotifications(50)` → `deliverNotification` each → `markSent` or `markFailed`. Special handling: if grammY error code 403 (user blocked bot), DELETE telegram_link for that user (per spec).
  - Job 2 (`0 9 * * *`): for each user with `morning_digest` enabled in their TZ → enqueue notification scheduled now()
  - Job 3 (`0 20 * * 0` Sun 20:00): same for `weekly_recap`
  - Job 4 (`0 21 * * *`): `workout_streak_warn` — for users with no sets in last 3 days AND pref enabled
- Modify: `apps/bot/src/index.ts` — call `startCron(bot)` after bot start
- Test: `apps/bot/tests/push-delivery.test.ts` — mock grammY, assert message format

Commit: `bot: push delivery + cron pickup`

---

## Task 5: Bot commands /today /add /done /help

**Files:**

- Create: `apps/bot/src/handlers/today.ts`, `add.ts`, `done.ts`, `help.ts`
- Modify: `apps/bot/src/bot.ts` — wire each
- Modify: `apps/bot/src/handlers/start.ts` — keep as is (link payload + greeting)

Behavior:

- `/today` — get user from telegram link, list active tasks deadlined today or pinned. Format: `1. <text> ⏰ HH:MM\n2. ...`
- `/add <text>` — create task with text content (escape HTML), reply with confirmation
- `/done <num>` — mark task N (from last `/today` shown) as done. Track shown task IDs in Redis: `tg:today:<userId>` = JSON list with TTL 1h.
- `/help` — print all commands

Auth: every command except /start checks `telegram_links` for the chat's user. If not linked → "Привяжи сначала аккаунт через /settings на сайте".

Commit: `bot: commands /today /add /done /help`

---

## Task 6: Inline callback handlers

**File:** Create `apps/bot/src/handlers/callbacks.ts`:

- `bot.callbackQuery(/^done_/, ...)` — extract taskId, mark done, edit message to add ✅
- `bot.callbackQuery(/^snooze_/, ...)` — extract taskId + minutes, update task deadline, re-enqueue notification, edit message

Wire in `apps/bot/src/bot.ts`.

Commit: `bot: inline callback handlers for done + snooze`

---

## Task 7: Webhook endpoint (production)

**Files:**

- Modify: `apps/bot/src/server.ts` — add POST `/webhook` route that validates `X-Telegram-Bot-Api-Secret-Token` header against `env.TELEGRAM_WEBHOOK_SECRET`, then passes update to bot.handleUpdate
- Document: README — `setWebhook` command for production setup

Commit: `bot: webhook endpoint with secret validation`

---

## Task 8: Smoke + tag

```bash
pnpm -r typecheck
pnpm -r test
```

Tag: `git tag plan5-complete -m "Plan 5 done: bot push delivery + cron + commands"`

---

## Conventions

- All bot handlers use the same auth pattern: `getUserByChatId(chatId)` returns user or null. If null, reply "Привяжи аккаунт сначала".
- `getUserByChatId` lives in `apps/bot/src/services/auth.ts`.
- Error logging via `logger.error({ err, ... }, 'message')`. Don't reply with stack traces.
- Production webhook setup is one-time per deploy — `setWebhook` script in `infra/scripts/setup-webhook.sh`.
