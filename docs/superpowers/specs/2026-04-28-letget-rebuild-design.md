# LETget — полный ребилд (Phase 1)

**Дата:** 2026-04-28
**Статус:** Design
**Версия:** 1.0

## 1. Контекст и цель

### Текущее состояние (v1)
LETget v1 — статичный SPA: vanilla HTML/CSS/JS + jQuery, данные в localStorage, PWA через service worker. 4 раздела (Задачи, Покупки, Код, Тренировки). Нет бэкенда, авторизации, синхронизации между устройствами. Ощущается сырым и ограниченным.

### Цель ребилда
Превратить LETget в полноценный продакшен-продукт:
- Серверная персистентность (Postgres) с доступом с любого устройства
- Многопользовательский режим с email/password авторизацией
- Telegram-интеграция: привязка аккаунта + push-уведомления о происходящем
- Полноценный редизайн под трендовую эстетику 2025-2026 (**Soft Dimensional Calm**)
- Уникальные акценты и анимации на каждый модуль
- Админка для контроля и управления
- Расширяемая архитектура под Phase 2 (7 новых модулей life-management)

### Не-цели Phase 1
- Realtime collaboration / sharing — Phase 3
- AI-ассистент — Phase 3
- Mobile-native приложения — Phase 3 (PWA достаточно)
- Telegram Mini App (полноценная версия внутри ТГ) — может быть Phase 3
- Мультиязычность — Phase 2 (сейчас RU только)

### Phase 2 roadmap (учитываем в архитектуре, не строим сейчас)
В порядке приоритета: **Привычки → Финансы → Календарь → Чтение → Рецепты/Еда → Дни рождения/Контакты → Тайм-трекер**.

Архитектура обязана быть модульной чтобы добавление новых модулей не требовало рефакторинга ядра.

---

## 2. Tech Stack

| Слой | Технология | Заметки |
|---|---|---|
| Фреймворк | Next.js 15 (App Router) + React 19 | TypeScript строгий, RSC-first |
| Стили | Tailwind CSS v4 + shadcn/ui + Framer Motion | shadcn — кастомизированные примитивы под Soft Dimensional |
| БД | PostgreSQL 16 (Docker, изолированный контейнер) | Порт 5440 на VPS, чтобы не конфликтовать |
| ORM | Drizzle | Типобезопасный, миграции, не run-time generation |
| Auth | Better Auth | Email + password + Telegram link plugin (custom) |
| Email | Resend | Free tier 3k/мес, SDK |
| Кэш / сессии / rate-limit | Redis (existing на VPS) | DB index 3 для изоляции |
| Telegram bot framework | grammY | TypeScript-фреймворк, активно поддерживается |
| Реверс-прокси | Nginx (existing) | Терминирует TLS, маршрутизирует на Web/Bot |
| SSL | Let's Encrypt через Certbot (existing) | Авто-обновление |
| Process manager | PM2 (existing) | Web и Bot — два независимых процесса |
| Менеджер пакетов | pnpm (existing) | Workspaces для монорепо-lite |
| Валидация | Zod | Шарится между фронтом, API и ботом |
| HTML sanitization | DOMPurify (server-side) | Для rich-text задач |
| Логирование | Pino (JSON) → файлы → logrotate | Единый формат для web и bot |
| Тестирование | Vitest (unit/integration) + Playwright (e2e) | CI: GitHub Actions |
| Линтинг | ESLint + Prettier + Husky pre-commit | lint-staged |

---

## 3. Системная архитектура

### Топология процессов на VPS (89.208.85.246)

```
                     Internet
                        │
                        ▼
              ┌──────────────────┐
              │ Nginx :80/:443   │  (existing, добавляем vhost letget.spassonic.ru)
              └─────────┬────────┘
                        │
          ┌─────────────┴───────────────┐
          │                             │
          ▼                             ▼
   ┌─────────────┐              ┌─────────────┐
   │ Web :3040   │              │ Bot :3041   │
   │ apps/web    │              │ apps/bot    │
   │ Next.js 15  │              │ grammY +    │
   │ PM2#1       │              │ node-cron   │
   └──────┬──────┘              │ PM2#2       │
          │                     └──────┬──────┘
          │                            │
          └────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
  ┌──────────┐                 ┌──────────┐
  │ Postgres │                 │ Redis    │
  │ :5440    │                 │ :6379    │
  │ Docker   │                 │ existing │
  └──────────┘                 └──────────┘
```

### Маршрутизация Nginx
- `letget.spassonic.ru/` → `127.0.0.1:3040` (Web)
- `letget.spassonic.ru/api/telegram/webhook` → `127.0.0.1:3041` (Bot)
- `letget.spassonic.ru/uploads/*` → `alias /var/www/letget/uploads/`

### Структура репозитория (pnpm workspaces)
```
return_toDO/
├── apps/
│   ├── web/                 # Next.js 15 — фронт + API routes + admin
│   └── bot/                 # grammY + cron-задачи (digest, deadlines, recap)
├── packages/
│   ├── db/                  # Drizzle schema + клиент (общий)
│   └── lib/                 # Zod-схемы, утилиты, типы (общий)
├── infra/
│   ├── docker/              # docker-compose для local dev (postgres, redis)
│   ├── nginx/               # vhost-конфиг
│   └── deploy/              # скрипты деплоя на VPS
├── docs/
│   └── superpowers/         # спеки и планы
├── .github/
│   └── workflows/           # CI
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

### Свободные порты на VPS
Существующие занятые: 3000, 3001, 3020, 3030, 5050, 8080, 8081, 9100, 9101, 18000, 18001, 5433-5436, 27017, 6379. Выбраны свободные:
- `:3040` — Web
- `:3041` — Bot
- `:5440` — Postgres (Docker)

---

## 4. Data Model

### 4.1 Auth & Identity (6 таблиц + расширения)

**users** (с расширением для admin)
- `id` uuid PK
- `email` text UNIQUE NOT NULL
- `emailVerified` timestamp?
- `name` text?
- `image` text?
- `role` enum('user', 'admin') NOT NULL DEFAULT 'user' INDEX
- `createdAt` timestamp DEFAULT now()
- `updatedAt` timestamp

**sessions**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `token` text UNIQUE
- `expiresAt` timestamp
- `ipAddress` text?
- `userAgent` text?
- `createdAt` timestamp

**accounts** (Better Auth credential provider)
- `id` uuid PK
- `userId` uuid FK → users CASCADE
- `providerId` text NOT NULL (всегда `'credential'` в Phase 1)
- `accountId` text NOT NULL (= email)
- `password` text? (bcrypt hash, cost 12)
- `createdAt`, `updatedAt`

**verifications** (verify email, password reset)
- `id` uuid PK
- `identifier` text (email)
- `value` text (token)
- `expiresAt` timestamp INDEX
- `createdAt`

**telegram_links** (1:1 с users)
- `userId` uuid PK FK → users CASCADE
- `telegramId` bigint UNIQUE NOT NULL
- `username` text?
- `chatId` bigint NOT NULL
- `linkedAt` timestamp DEFAULT now()

**user_preferences** (1:1 с users)
- `userId` uuid PK FK → users CASCADE
- `theme` enum('light', 'dark', 'system') DEFAULT 'light'
- `language` text DEFAULT 'ru'
- `timezone` text DEFAULT 'Europe/Moscow'
- `defaultView` text DEFAULT 'tasks'
- `migratedV1At` timestamp?  *(маркер успешной миграции из v1)*
- `updatedAt`

### 4.2 Notifications (2 таблицы)

**notification_prefs**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `eventType` enum (см. ниже)
- `enabled` bool DEFAULT true
- `channel` enum('telegram') DEFAULT 'telegram'
- `timeOfDay` time? (для digest, recap)
- `minutesBefore` int? (для deadline)
- UNIQUE(userId, eventType)

**EventType enum (Phase 1):**
- `morning_digest`
- `task_deadline`
- `workout_streak_warn`
- `weekly_recap`
- `custom_reminder`

Phase 2 расширит enum: `habit_remind`, `bill_due`, `birthday_tomorrow`, `book_progress_reminder`, `meal_plan_reminder`, `time_tracker_pause`. Структуру таблиц менять не надо.

**notifications_queue**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `eventType` enum (см. выше)
- `payload` jsonb (текст сообщения, ссылки на сущности)
- `scheduledFor` timestamp NOT NULL INDEX
- `sentAt` timestamp?
- `attempts` int DEFAULT 0
- `lastError` text?
- `createdAt` timestamp DEFAULT now()
- INDEX (sentAt, scheduledFor) WHERE sentAt IS NULL — для быстрого pickup'а ботом

### 4.3 Admin (2 таблицы)

**admin_audit_log** (append-only)
- `id` uuid PK
- `adminUserId` uuid FK → users INDEX
- `action` text NOT NULL — `view_user_content`, `force_logout`, `delete_user`, `manual_send_notification`, `update_user_role`, `wipe_user_data`, `restart_bot`, `manual_backup`, etc.
- `targetType` text? — `user`, `task`, `session`, `notification`, etc.
- `targetId` text?
- `metadata` jsonb (изменённые поля до/после)
- `ipAddress` text?
- `userAgent` text?
- `createdAt` timestamp INDEX

**login_history**
- `id` uuid PK
- `userId` uuid? FK → users SET NULL (nullable для failed без существующего юзера)
- `email` text NOT NULL (для failed-попыток без юзера)
- `success` bool NOT NULL
- `failureReason` text? (`wrong_password`, `email_not_verified`, `account_disabled`, `rate_limited`)
- `ipAddress` text?
- `userAgent` text?
- `attemptedAt` timestamp INDEX

### 4.4 Модули Phase 1 (6 таблиц)

**tasks**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `contentHtml` text (sanitized DOMPurify)
- `contentText` text (для search и digest)
- `isDone` bool DEFAULT false
- `isPinned` bool DEFAULT false
- `deadline` timestamp? INDEX
- `doneAt` timestamp?
- `deletedAt` timestamp?
- `searchVector` tsvector GENERATED ALWAYS AS (to_tsvector('russian', contentText)) STORED
- `createdAt`, `updatedAt`
- INDEX (userId, isDone, isPinned), GIN(searchVector)

**shopping_trips**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `name` text DEFAULT 'Поход'
- `isCurrent` bool DEFAULT false
- `completedAt` timestamp?
- `createdAt`, `updatedAt`
- UNIQUE PARTIAL: (userId) WHERE isCurrent = true

**shopping_items**
- `id` uuid PK
- `tripId` uuid FK → shopping_trips CASCADE
- `name` text NOT NULL
- `quantity` text? — '2 кг', '1 шт'
- `isDone` bool DEFAULT false
- `position` int NOT NULL — для drag&drop
- `doneAt` timestamp?
- `createdAt`
- INDEX (tripId, position)

**code_snippets**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `title` text?
- `code` text NOT NULL
- `language` text? (auto-detect через highlight.js или manual)
- `isPinned` bool DEFAULT false
- `deletedAt` timestamp?
- `searchVector` tsvector GENERATED — на title+code
- `createdAt`, `updatedAt`

**workout_exercises**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `name` text NOT NULL
- `slug` text NOT NULL
- `icon` text? (emoji)
- `archivedAt` timestamp?
- `createdAt`
- UNIQUE(userId, slug)
- *Seed на регистрацию:* pullups (Подтягивания 💪), dips (Брусья), pushups (Отжимания)

**workout_sets**
- `id` uuid PK
- `userId` uuid FK → users CASCADE INDEX
- `exerciseId` uuid FK → workout_exercises CASCADE
- `reps` int NOT NULL
- `notes` text?
- `performedAt` timestamp DEFAULT now() INDEX
- INDEX (userId, performedAt DESC)

### 4.5 Конвенции

- PK — `uuid v7` (sortable + globally unique). Используем хелпер `genId()` в `packages/db`
- FK на `users.id` везде → INDEX обязателен
- Soft-delete через `deletedAt` для контента (`tasks`, `code_snippets`); hard-delete CASCADE для контейнеров (trips→items)
- Timestamps в UTC; на фронте конверсия по `user_preferences.timezone`
- Search через `tsvector GENERATED` + GIN-индекс; russian dictionary
- RLS политики на каждой таблице с user data: `userId = current_user_id()` (двойная защита если ошибётся API)
- Расширения PG: `uuid-ossp`, `pg_trgm` (для fuzzy search в Phase 2)
- Все таблицы получают `createdAt`/`updatedAt` через миксин Drizzle

---

## 5. Auth + Telegram + Migration flows

### 5.1 Регистрация (email + password)
1. User → POST `/api/auth/sign-up` с email + password
2. Better Auth: создаёт `users`, `accounts` (bcrypt пароль), `verifications` (verify-токен)
3. Если `email == ADMIN_EMAIL` env → `users.role = 'admin'`
4. Resend → email с magic-link (срок 24ч)
5. User кликает → `/api/auth/verify-email?token=...` → `users.emailVerified = now()` → создаётся `session` → редирект в приложение
6. При первом успешном логине триггерится Flow 5.5 (миграция v1)

### 5.2 Login
1. User → POST `/api/auth/sign-in`
2. Better Auth проверяет bcrypt → создаёт `session`
3. Запись в `login_history` (success/fail, IP, UA, reason при fail)
4. Rate-limit через Redis: 5 fails / 15 min с одного IP → 429
5. Если `!emailVerified` → блок входа, повторная отправка верификации

**Forgot password:** запрос → email с reset-токеном (15 мин) → `/reset-password?token=...` → новый пароль → инвалидация всех сессий кроме текущей.

### 5.3 Telegram link
1. User в `/settings` жмёт "Подключить ТГ"
2. Web генерирует `linkToken` (UUID v4, TTL 10 мин в Redis)
3. Показывает кнопку → `https://t.me/letget_bot?start=link_<linkToken>`
4. User в ТГ → /start → Bot валидирует токен → создаёт `telegram_links` → удаляет токен из Redis → "✅ ТГ привязан"
5. Edge: если `telegramId` уже привязан — ошибка "отвяжите там сначала"

### 5.4 Push delivery (на примере task_deadline)
1. User создаёт задачу с deadline → если `task_deadline` enabled в `notification_prefs`, ставится запись в `notifications_queue` (`scheduledFor = deadline - minutesBefore`)
2. Bot cron каждую минуту: SELECT FROM `notifications_queue` WHERE `scheduledFor <= now()` AND `sentAt IS NULL` AND `attempts < 5`
3. Bot подгружает актуальные данные задачи. Если `isDone || deletedAt` — пропускает + помечает `sentAt = now()`
4. Bot шлёт через ТГ API с inline-кнопками (`✅ Готово`, `📅 +1 час`)
5. Success → `sentAt = now()`. Fail → `attempts += 1`, `scheduledFor += 60s * attempts` (exponential backoff). После 5 попыток — мёртвая запись с `lastError`, видна админу.

### 5.5 Migration v1 → v2 (auto, при первом логине)
1. После успешного логина клиент проверяет: есть ли данные в localStorage `letget:*` И `user_preferences.migratedV1At` IS NULL
2. Если да — читает все ключи v1 (`tasks`, `shopping`, `code`, `workouts`)
3. POST `/api/migrate/v1` с JSON всех данных
4. Backend: Zod-валидация, транзакция импорта во все 4 модуля с маппингом полей v1→v2, проставление `migratedV1At = now()`
5. Toast: "Импортировано: 17 задач, 4 похода, 8 сниппетов, 23 подхода"
6. localStorage помечает `letget:migrated = true` (старые данные не удаляем для recovery)

**Идемпотентность:** если `migratedV1At` уже стоит — миграция пропускается даже если localStorage снова есть данные (кросс-девайс защита).

---

## 6. Admin Panel

### Доступ
- Все `/admin/*` роуты защищены middleware `requireAdmin()` (проверка `users.role = 'admin'`)
- Двойная проверка: middleware (Edge) + проверка в RSC layout
- Каждое действие админа автоматически логируется в `admin_audit_log` через декоратор-обёртку

### Разделы (10 + Phase 1.5)

1. **Dashboard** — live-метрики: всего юзеров, DAU/WAU/MAU, push delivery rate (success/total), failed pushes, новые регистрации, активность по модулям. Период переключаемый (24h / 7d / 30d).

2. **Users** — таблица с поиском и пагинацией. Колонки: email, имя, role, ТГ-привязан, последний логин, кол-во tasks/sets/snippets/trips. Действия: открыть профиль, force logout (инвалидация всех сессий), изменить role, выслать reset-email, soft-delete с восстановлением.

3. **User profile** — полная карточка: данные, статистика по модулям, история логинов из `login_history`, ТГ-связка с возможностью отвязать, активные сессии, все push-уведомления. Mini-аналитика активности.

4. **Контент** — глобальный поиск по контенту всех юзеров (tasks/code/shopping). Read-only по умолчанию, можно удалить нарушающее. Фильтры по модулю, юзеру, периоду.

5. **Notifications** — очередь pending/sent/failed. Действия: вручную retry failed, отменить pending, посмотреть payload, отправить тестовый push на конкретного юзера. Статистика доставки за период.

6. **Telegram bot** — статус (онлайн / webhook OK / errors), последние команды от юзеров с ответами, ошибки. Кнопка "Перезапустить бота" → `pm2 restart letget-bot` через системный API.

7. **Audit log** — все действия админа. Поиск по юзеру/действию/периоду. Append-only (нельзя удалить).

8. **Login history** — все попытки логинов всех юзеров. Подсветка suspicious activity (много fails с одного IP, нетипичный UA, geo-аномалии).

9. **System health** — CPU/RAM сервера (через `os` API), статус Postgres/Redis/Nginx (HEAD-запросы / `pg_isready` / `redis-cli ping`), размер БД, кол-во active sessions, дисковое пространство.

10. **Backups** — список бэкапов БД (cron делает ежедневно 03:00), кнопка "Сделать бэкап сейчас", скачать дамп (signed URL). Restore — через CLI скрипт (для безопасности).

**Phase 1.5 расширения** (после стабилизации Phase 1): 2FA для админа (TOTP через Better Auth plugin), IP whitelist для admin-эндпоинтов, отдельный rate-limit на `/admin/*`, экспорт audit-log в S3 для долгосрочного хранения.

### Защита sensitive действий
Действия `delete_user`, `force_logout`, `update_user_role`, `wipe_user_data`, `restart_bot` требуют подтверждения через модалку с вводом подтверждающей фразы (например `"DELETE max@gmail.com"`).

---

## 7. Design System (Soft Dimensional Calm)

### Палитра (light theme)
- **Canvas (фон страницы):** cream-50 `#fcf8f1`
- **Panel (мягкий блок):** cream-100 `#f5ecd7`
- **Border:** cream-200 `#e5d9c4`
- **Surface (карточки):** `#ffffff`
- **Ink (основной текст):** `#1a1410`
- **Ink-soft (вторичный):** `#5a4a3a`
- **Ink-faint (мета):** `#8a7458`
- **Brand gradient:** terracotta `#ffb347 → #ff7e5f`

### Палитра (dark theme — инвертированная тёплая)
- **Canvas:** `#16110d`
- **Surface:** `#1f1812`
- **Ink:** `#f5ecd7`
- Тоггл в `/settings` (theme: light / dark / system).

### Типографика
- **Display** (h1, кочующие хедеры): Manrope 800, 32px, letter-spacing -0.025em
- **Heading** (h2 разделов): Manrope 700, 20px, -0.018em
- **Subheading** (card title): Manrope 600, 14px
- **Body:** Manrope 500, 13px, line-height 1.5
- **Mono kicker** (метки, коды, числа в админке): JetBrains Mono 500, 11px, +0.04em letter-spacing

### Акценты по модулям (11 штук)

**Phase 1:**
| Модуль | Цвет | Сигнатурная анимация |
|---|---|---|
| Tasks | Forest green `#4ade80 → #16a34a` | Confetti burst + fade-to-strike при чеке |
| Shopping | Coral `#ff7e5f → #e85a3e` | "Drop into cart": item slides+scales в иконку корзины |
| Code | Violet `#c06bff → #9333ea` | Copy success: ripple-flash + check-icon morph |
| Workout | Pink-magenta `#ff6b9d → #db2777` | Rep counter pulse + streak-flame растёт |

**Phase 2 (заранее):**
| Модуль | Цвет |
|---|---|
| Habits | Grow green `#22c55e → #15803d` |
| Finance | Deep teal `#14b8a6 → #0d9488` |
| Calendar | Blue `#3b82f6 → #1e40af` |
| Reading | Amber `#f59e0b → #b45309` |
| Recipes | Burnt orange `#f97316 → #c2410c` |
| Birthdays | Pink `#ec4899 → #9d174d` |
| Time Tracker | Indigo `#6366f1 → #3730a3` |

### Tokens (CSS variables)

**Spacing:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56px (`--space-1` … `--space-14`)

**Radius:** sm 6 (chips) / md 10 (inputs) / lg 14 (cards) / xl 22 (modals) / full 9999

**Motion durations:** instant 100 / fast 160 (hover) / base 220 (default) / slow 320 (modal) / slower 480 (page transitions)

**Easing:**
- ease-out: `cubic-bezier(.16, 1, .3, 1)` — "fluid out"
- ease-in-out: `cubic-bezier(.65, 0, .35, 1)` — для loops
- spring-default: Framer `spring(0.5, 30)` — для cards
- spring-bouncy: `spring(0.45, 12)` — для confetti, decorative

**Shadows (на cream фоне):**
- sm: `0 1px 0 rgba(0,0,0,0.04), 0 2px 4px rgba(120,100,80,0.06)` — borders/dividers
- md: `0 1px 0 rgba(0,0,0,0.04), 0 4px 10px -4px rgba(120,100,80,0.12), 0 2px 4px rgba(120,100,80,0.06)` — карточки default
- lg: `0 1px 0 rgba(0,0,0,0.04), 0 12px 24px -8px rgba(120,100,80,0.2), 0 4px 8px rgba(120,100,80,0.08)` — hover/active
- xl: `0 1px 0 rgba(0,0,0,0.04), 0 24px 48px -12px rgba(120,100,80,0.3), 0 8px 16px rgba(120,100,80,0.12)` — модалки

### Анимационные принципы
- **Микро-фидбек на кнопках:** scale 1 → 0.98 + brightness +5% с durations `--dur-fast`
- **Списки:** stagger children 40ms между, fade+slide-up 8px, ease-out
- **Чек-задачи:** spring scale на чекбоксе, fade-to-strike текста, конфетти 8 частиц с физикой
- **Drag&drop:** только для reorder задач/items в покупках, lift-shadow + ghost
- **Модалки:** backdrop fade `--dur-slow`, card scale+slide spring; обратная на close/Esc/click outside
- **Page transitions** между sidebar-разделами: fade+slide `--dur-slow`, RSC streaming
- **Loading skeletons:** shimmer cream-100 → cream-50 (никакого spinner-only)
- **Empty states:** custom warm SVG иллюстрации + 1 CTA, лёгкий float
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` отключает все non-essential, оставляет opacity transitions

### Component stack

**Primitives** — shadcn/ui (Radix-based): Button, Input, Dialog, DropdownMenu, Tabs, Tooltip, Toast, Switch, Checkbox, Select, Sheet (mobile drawer), Command (search palette). Стилизованы через CSS vars под Soft Dimensional.

**Domain components** — TaskCard, ShoppingItemRow, CodeSnippetCard, WorkoutCounter, StatTile, ModuleHeader, EmptyState, SearchPalette, NotificationToast. Каждый в `apps/web/src/modules/<name>/components/`.

**Layout** — AppShell (sidebar + topbar + content), MobileDrawer, BottomNav (≤lg), AdminShell (отдельный layout с denser navigation).

**Адаптивность:** `≥1024px` — desktop (sidebar). `768-1023` — tablet (collapsed sidebar). `<768` — mobile (bottom-nav + drawer). Topbar поиск всегда на месте.

---

## 8. Telegram Bot (apps/bot)

### Endpoints
- `POST /api/telegram/webhook` (проксируется nginx → :3041) — приём апдейтов
- Webhook secret валидируется через `secret_token` header (Telegram Bot API ≥ 6.0)

### Команды
- `/start` — приветствие, инструкция привязки
- `/start link_<token>` — обработка привязки (Flow 5.3)
- `/today` — список задач на сегодня
- `/add <text>` — быстрое создание задачи
- `/done <num>` — отметить задачу выполненной (показанные в /today)
- `/help` — список команд

### Inline callbacks
- `done_<taskId>` — пометить выполненной из push-уведомления
- `snooze_<taskId>_<minutes>` — отложить дедлайн
- `recap_more` — подробный recap после еженедельного дайджеста

### Cron schedule (node-cron)
- `09:00` (per timezone) — `morning_digest` для всех с включённым флагом
- `* * * * *` (каждую минуту) — pickup `notifications_queue` где `scheduledFor <= now()`
- `Sunday 20:00` — `weekly_recap`
- `21:00` (per timezone) — `workout_streak_warn` если давно не было сетов И флаг включён

### Push retry
- Exponential backoff: после ошибки `attempts++`, `scheduledFor += 60s * attempts`
- Max 5 attempts, после — мёртвая запись с `lastError`, видна админу
- Особые ошибки ТГ API: `403 (user blocked bot)` → пометить `telegram_links` как inactive, не пытаться больше

---

## 9. Module Specifications (Phase 1)

### 9.1 Tasks
- Rich-text composer (contenteditable + DOMPurify санитайзинг на бэке)
- Поддержка bold, italic, underline, ul/ol, ссылок (как в v1)
- Дедлайн (опциональный, через date-time picker)
- Pin (3 пина max — UX-ограничение, не БД)
- Фильтры: All / Active / Done
- Поиск (часть глобального) — tsvector
- Bulk-действия: select multiple → mark done / delete (как в v1 bulkbar, с улучшенной UX)
- Сортировка: pinned первыми, затем по deadline (если есть), затем по `createdAt DESC`
- Edit модалка с тем же rich-text

### 9.2 Shopping
- Активный поход + история
- В активном: композер "Что купить?" + Qty + кнопка
- Datalist подсказки из истории (как в v1)
- Чек-боксы, drag&drop reorder через `position`
- "Завершить поход" → `completedAt`, перестаёт быть `isCurrent`
- "Повторить поход" → копирует items в новый `isCurrent` поход
- "Копировать список" → markdown в clipboard

### 9.3 Code
- Сниппеты с auto-detect языка (highlight.js на фронте)
- Title опционально
- Pin / unpin
- Copy с тостом
- Поиск по title + code
- Soft-delete с восстановлением (Phase 1.5)

### 9.4 Workouts
- Tabs упражнений (seed: подтягивания, брусья, отжимания) + кнопка добавить кастомное
- Counter повторений в подходе (− / value / +)
- Кнопка "Добавить подход" → запись в `workout_sets`
- Сводка: всего за всё время, за 7 дней, по упражнениям
- История: heatmap-стиль за 14 дней
- "Сбросить сегодня" — удаление сетов за текущий день (с подтверждением)

---

## 10. Deployment

### Nginx vhost (`/etc/nginx/sites-available/letget.conf`)
```nginx
server {
  listen 80;
  server_name letget.spassonic.ru;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl http2;
  server_name letget.spassonic.ru;

  ssl_certificate /etc/letsencrypt/live/letget.spassonic.ru/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/letget.spassonic.ru/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

  client_max_body_size 10M;
  gzip on; gzip_types text/plain application/json text/css application/javascript;

  location /api/telegram/webhook {
    proxy_pass http://127.0.0.1:3041;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /uploads/ {
    alias /var/www/letget/uploads/;
    expires 7d;
  }

  location / {
    proxy_pass http://127.0.0.1:3040;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### PM2 ecosystem (`/var/www/letget/ecosystem.config.js`)
```js
module.exports = {
  apps: [
    {
      name: 'letget-web',
      script: 'apps/web/.next/standalone/apps/web/server.js',
      env: { NODE_ENV: 'production', PORT: 3040 },
      max_memory_restart: '500M',
      error_file: '~/logs/letget/web.err.log',
      out_file: '~/logs/letget/web.out.log',
    },
    {
      name: 'letget-bot',
      script: 'apps/bot/dist/index.js',
      env: { NODE_ENV: 'production', PORT: 3041 },
      max_memory_restart: '300M',
      error_file: '~/logs/letget/bot.err.log',
      out_file: '~/logs/letget/bot.out.log',
    },
  ],
};
```
- `pm2 startup systemd` → авто-старт при ребуте
- `pm2 install pm2-logrotate` (14 дней, daily)

### Postgres (Docker)
- `docker-compose.prod.yml` в `infra/docker/`:
  - `postgres:16-alpine`
  - Порт `5440:5432` (только localhost binding)
  - Volume на `~/data/letget-postgres`
  - Healthcheck через `pg_isready`
- Пользователь `letget`, БД `letget`, пароль из секретов окружения (см. ниже)

### Окружение и секреты

`.env.production` располагается на сервере (chmod 600, owner ubuntu, в git **не** коммитится). Шаблон — `apps/web/.env.example` без значений. Список переменных:

| Переменная | Назначение | Источник |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Postgres connection (5440, letget, letget) | генерится при первом deploy |
| `REDIS_URL_FORMAT` | host=localhost port=6379 db=3 | существующий Redis |
| `BETTER_AUTH_SECRET` | Сессии и подписи Better Auth | `openssl rand -hex 32` при setup |
| `BETTER_AUTH_URL` | Канонический URL приложения | `https://letget.spassonic.ru` |
| `RESEND_API_KEY` | Отправка email | dashboard.resend.com |
| `TELEGRAM_BOT_TOKEN` | Авторизация бота | @BotFather |
| `TELEGRAM_BOT_USERNAME` | Используется во всех ссылках | значение: `letget_bot` |
| `TELEGRAM_WEBHOOK_SECRET` | Проверка `X-Telegram-Bot-Api-Secret-Token` header | `openssl rand -hex 16` |
| `ADMIN_EMAIL` | Email который автопромоутится в admin | `igopexa61994@gmail.com` |
| `APP_URL` | Канонический URL для деплоя/писем | дублирует BETTER_AUTH_URL |
| `NODE_ENV` | `production` | в PM2 ecosystem |

**Правила работы с секретами:**
- Секреты НЕ хранятся в коде, в спеках, в git, в логах
- Pino redacts следующие поля в логах: `password`, `token`, `secret`, `apiKey`, `authorization`, `cookie`
- `.env.production` создаётся вручную при первом деплое скриптом `infra/deploy/setup-env.sh` (интерактивный)
- Ротация секретов раз в 6 месяцев или при подозрении на утечку
- Резервная копия секретов — в локальном password manager юзера, не в репозитории

### Бэкапы (cron, `~/scripts/backup-letget.sh`)
```bash
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M)
mkdir -p ~/backups/letget
docker exec letget-postgres pg_dump -U letget -F c letget > ~/backups/letget/letget-$DATE.dump
find ~/backups/letget/letget-*.dump -mtime +30 -delete
```
Cron: `0 3 * * * /home/ubuntu/scripts/backup-letget.sh >> ~/logs/letget/backup.log 2>&1`

### Деплой-скрипт (упрощённо, `infra/deploy/deploy.sh`)
1. SSH на VPS
2. `cd /var/www/letget && git pull`
3. `pnpm install --frozen-lockfile`
4. `pnpm --filter @letget/db migrate:apply`
5. `pnpm --filter @letget/web build`
6. `pnpm --filter @letget/bot build`
7. `pm2 reload ecosystem.config.js --update-env`
8. Health-check: curl `https://letget.spassonic.ru/api/health` → 200

### ⚠️ Disk space concern
На VPS свободно 4.7 ГБ из 25 ГБ. Перед первым деплоем — провести аудит занятого места и/или согласовать с провайдером расширение volume. Вынесено в открытые вопросы (раздел 14).

---

## 11. Operations

### Логи
- Web/Bot stdout/stderr → PM2 (auto-collect)
- Структурированные app-logs через Pino → `~/logs/letget/web.log`, `bot.log`
- Ротация через PM2 logrotate (14 дней)
- Errors дополнительно реплицируются в `admin_audit_log` (тип `system_error`) для просмотра в админке

### Мониторинг
- `/api/health` (Web) — проверка БД (SELECT 1), Redis ping → 200/500
- Bot health — heartbeat в Redis раз в минуту, админка проверяет
- System health в админке — раз в 30 сек обновление

### Disaster recovery
- Daily Postgres dump → `~/backups/letget/`
- Раз в неделю — копирование последнего дампа на внешний storage (S3 или другой VPS) — Phase 1.5
- Restore процедура задокументирована в `docs/runbooks/restore.md` (создать в Phase 1)

---

## 12. Testing strategy

### Unit + integration (Vitest)
- `packages/lib`: Zod-схемы, утилиты
- `packages/db`: репозитории Drizzle (на test-инстансе Postgres через testcontainers или docker-compose.test)
- `apps/web/src/modules/*/services`: бизнес-логика
- `apps/bot/handlers`: команды бота с mock'ом ТГ API
- Coverage таргет: ≥70% для services и handlers

### E2E (Playwright)
Критические флоу:
1. Регистрация → верификация email → логин → открытие приложения
2. Привязка ТГ через deep-link (с mock'нутым ТГ API)
3. Миграция v1 (с предзаполненным localStorage)
4. CRUD задачи (добавить → редактировать → пометить → удалить)
5. Добавление подхода тренировки → проверка в сводке
6. Админ-логин → просмотр user → audit log запись

### CI (GitHub Actions)
1. Lint (ESLint + Prettier check)
2. Typecheck (`tsc --noEmit`)
3. Unit (Vitest)
4. Build (всё)
5. E2E (Playwright headless)
6. Только passing → merge allowed

### Pre-commit (Husky + lint-staged)
- ESLint --fix на изменённые файлы
- Prettier --write на изменённые
- typecheck на полный проект (быстрый incremental)

---

## 13. Security

### Аутентификация
- bcrypt cost 12 для паролей
- Сессии в Postgres (отзываемые), не JWT в куках
- httpOnly + secure + sameSite=lax cookies
- Email verification обязательна перед логином
- Password reset с одноразовыми токенами (15 мин)
- 2FA для админа — Phase 1.5 (TOTP через Better Auth)

### Авторизация
- middleware на `/admin/*` (двойная: edge + RSC)
- RLS политики Postgres (defense in depth)
- Каждое чтение/запись в БД фильтруется по `userId`

### Input validation
- Zod на каждом API-endpoint (входы и выходы)
- DOMPurify (server-side) для rich-text задач перед сохранением
- Параметризованные запросы только (через Drizzle, нет string concat)

### Rate limiting
- На `/api/auth/*` через Redis: 5 fails / 15 min
- На `/api/migrate/*`: 1 раз в час с одного юзера
- На `/api/telegram/webhook`: проверка `secret_token` ТГ API
- На `/admin/*` отдельный — Phase 1.5

### Headers
- HSTS preload
- CSP без unsafe-inline (кроме Yandex.Metrika nonce)
- X-Frame-Options DENY
- X-Content-Type-Options nosniff
- Referrer-Policy strict-origin-when-cross-origin
- Permissions-Policy ограничивает camera/mic/geo

### Секреты — общие правила
Полный список переменных и правила работы — в разделе 10 ("Окружение и секреты"). Кратко: в код не попадают, redacted в логах, ротируются раз в 6 месяцев.

### Telegram security
- Webhook с `secret_token` (проверяем header `X-Telegram-Bot-Api-Secret-Token`)
- Валидация что `telegramId` из апдейта совпадает с `from.id` (anti-spoofing)
- linkToken — UUID v4, TTL 10 мин в Redis, single-use

### Supply chain
- pnpm с lockfile
- Renovate / Dependabot для патчей (Phase 1.5)
- npm audit в CI

---

## 14. Open questions / Risks

1. **Disk space** — 4.7 ГБ свободно на VPS. Нужно провести аудит и/или расширить volume у провайдера до деплоя. Иначе риск что pnpm install + Docker pull сожрут всё.

2. **Resend deliverability** — newly created Resend домен может попадать в спам первые недели. Нужно настроить SPF/DKIM/DMARC для `spassonic.ru`. Проверить через mail-tester.com.

3. **Telegram webhook setup** — после деплоя нужно один раз установить webhook через `setWebhook` API (включается в deploy-скрипт первым деплоем).

4. **Yandex.Metrika integration** — текущий тег 97203941 переносим как есть. Проверить что инициализация не блокируется CSP.

5. **Migration data integrity** — старая версия имела свой формат HTML в задачах. Нужно тестировать миграцию на реальных данных юзера перед prod-релизом.

6. **Cron timezones** — `morning_digest` шлётся в 09:00 локального времени юзера. Бот должен пробегать по timezone-группам корректно. Использовать `luxon` или `date-fns-tz`.

7. **First user → admin auto-promotion** — если `ADMIN_EMAIL` env не установлен на момент первой регистрации, никто не станет админом. Решение: в seed-скрипте проверка наличия `ADMIN_EMAIL` ДО старта web-процесса.

---

## 15. Out of scope (Phase 3+)

- Realtime collaboration / sharing задач/списков
- AI-ассистент (натуральный ввод задач, smart suggestions)
- Mobile-native (React Native / Capacitor)
- Telegram Mini App (полноценная версия в ТГ)
- Голосовой ввод задач
- Apple Health / Google Fit интеграция (для тренировок)
- Импорт из Things 3 / Notion / Todoist
- Export в Markdown/CSV (есть только JSON-экспорт сейчас)
- Multi-tenant команды / организации

---

## 16. Success criteria для Phase 1

- ✅ Юзер может зарегистрироваться, верифицировать email, залогиниться
- ✅ Юзер может привязать Telegram и получать push-уведомления
- ✅ Юзер может пользоваться 4 модулями со всем функционалом v1 + улучшениями
- ✅ Данные юзера автоматически мигрируют из старой версии при первом логине
- ✅ Админ имеет полную панель управления юзерами и системой
- ✅ Все действия админа аудитируются
- ✅ Дизайн соответствует Soft Dimensional Calm с уникальными акцентами на каждый модуль
- ✅ Адаптивность работает от 320px до 4K
- ✅ Все критические e2e-тесты проходят
- ✅ Деплой на letget.spassonic.ru через `pm2 reload`, downtime ≤ 5 сек
- ✅ Бэкапы БД делаются автоматически каждый день
- ✅ Lighthouse perf ≥ 85, accessibility ≥ 95

---

## 17. Phase 2 hint (не строим, но архитектура поддержит)

Каждый новый модуль из Phase 2 = новая директория `apps/web/src/modules/<name>/` со своими components, services, schema. Регистрация в `module-registry.ts` (sidebar + bottom-nav генерятся динамически из реестра).

Расширения схемы БД: новые таблицы (habits, habit_logs, transactions, accounts, calendar_events, books, recipes, contacts, time_entries) — без изменений в существующих, кроме enum'а eventType в notification_prefs.

Этот спец-документ покрывает только Phase 1. Phase 2 получит свой отдельный спец-цикл (brainstorm → write-plan → execute) после стабилизации Phase 1.
