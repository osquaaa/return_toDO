# LETget · Phase 1 (Foundation)

> Списки и заметки на каждый день. Бэк + ТГ-бот + админка + мульти-устройства.

**Spec:** `docs/superpowers/specs/2026-04-28-letget-rebuild-design.md`
**Plan:** `docs/superpowers/plans/2026-04-28-foundation.md`

## Стек

- pnpm workspaces (apps/web, apps/bot, packages/db, packages/lib)
- Next.js 15 + React 19 + Tailwind v4
- Drizzle ORM + Postgres 16
- grammY + node-cron + Fastify
- Redis (сессии, очереди, rate-limit)
- Vitest

## Локальный setup

**Требования:** Node 20.18+, pnpm 10+, Docker.

```bash
# 1. Установить
pnpm install

# 2. Поднять Postgres + Redis
pnpm db:up

# 3. Прогнать миграции (с inline env, .env файлы НЕ коммитятся)
DB_HOST=localhost DB_PORT=5440 DB_NAME=letget DB_USER=letget \
DB_PASSWORD=$(cat infra/docker/db_password.txt) pnpm db:migrate

# 4. Запустить dev (web + bot)
DB_HOST=localhost DB_PORT=5440 DB_NAME=letget DB_USER=letget \
DB_PASSWORD=$(cat infra/docker/db_password.txt) \
REDIS_HOST=localhost REDIS_PORT=6379 REDIS_DB=3 \
APP_URL=http://localhost:3040 \
TELEGRAM_BOT_TOKEN=disabled TELEGRAM_BOT_USERNAME=letget_bot TELEGRAM_USE_LONG_POLLING=true \
pnpm dev
```

Проверка:

```bash
curl http://localhost:3040/api/health    # → 200, db ok, redis ok
curl http://127.0.0.1:3041/health        # → 200, bot ok
```

## Команды

| Команда                                      | Что делает               |
| -------------------------------------------- | ------------------------ |
| `pnpm dev`                                   | Web + bot в watch-режиме |
| `pnpm build`                                 | Билд обоих приложений    |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Качество                 |
| `pnpm db:up` / `pnpm db:down`                | Docker контейнеры        |
| `pnpm db:migrate` / `pnpm db:studio`         | Миграции и UI            |

## Структура

```
apps/web        Next.js 15 (фронт + API + admin)
apps/bot        grammY bot + cron + Fastify health
packages/db     Drizzle schema + клиент Postgres
packages/lib    Zod-схемы + типы (общие)
infra/docker    docker-compose dev
docs/           Спеки и планы
legacy/         Старая версия v1 (reference)
```

## Phase roadmap

- ✅ **Plan 1:** Foundation — монорепо + БД + скелеты
- ⏳ Plan 2: Auth + Migration v1
- ⏳ Plan 3: Tasks module
- ⏳ Plan 4: Shopping + Code + Workouts
- ⏳ Plan 5: Telegram bot (commands + push)
- ⏳ Plan 6: Admin panel
- ⏳ Plan 7: Design polish + PWA + e2e
- ⏳ Plan 8: Deploy + Ops (VPS, nginx, ssl, бэкапы)

## License

Private.
