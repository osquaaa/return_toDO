# LETget

> Списки и заметки на каждый день. Бэк + ТГ-бот + админка + мульти-устройства.

**Spec:** `docs/superpowers/specs/2026-04-28-letget-rebuild-design.md`
**Plans:** `docs/superpowers/plans/`

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
REDIS_HOST=localhost REDIS_PORT=6382 REDIS_DB=3 \
APP_URL=http://localhost:3040 \
BETTER_AUTH_SECRET=$(openssl rand -hex 32) \
ADMIN_EMAIL=igopexa61994@gmail.com \
TELEGRAM_BOT_TOKEN=disabled TELEGRAM_BOT_USERNAME=letget_bot TELEGRAM_USE_LONG_POLLING=true \
pnpm dev
```

> **Note:** `BETTER_AUTH_SECRET` обязателен (≥32 символа). `RESEND_API_KEY` опционально — без него письма верификации/сброса пароля печатаются в консоль (`[email:dev-stub]`). `ADMIN_EMAIL` — email который при регистрации автопромоутится в admin.

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
- ✅ **Plan 2:** Auth + Migration v1 — Better Auth, sessions, Telegram link, v1→v2 import
- ✅ **Plan 3:** Tasks module
- ✅ **Plan 4:** Shopping + Code + Workouts
- ✅ **Plan 5:** Telegram bot (commands + push)
- ✅ **Plan 6:** Admin panel
- ✅ **Plan 7:** Design polish + PWA + e2e
- ✅ **Plan 8:** Deploy + Ops (VPS, nginx, ssl, бэкапы)

## Auth flows (post Plan 2)

- **Sign-up:** `/sign-up` → email с verify-токеном (24ч) → `/verify-email?token=...` → автологин.
- **Sign-in:** `/sign-in` (rate-limit 5 fails / 15min по IP, login_history пишется).
- **Forgot password:** `/forgot-password` → reset email (15 мин) → `/reset-password?token=...`.
- **Telegram link:** `/settings` → "Подключить Telegram" → deep-link в бота → /start link\_<token> → `telegram_links` row.
- **v1 migration:** при первом входе клиент читает `letget:*` из localStorage и шлёт на `/api/migrate/v1` (идемпотентно через `user_preferences.migratedV1At`).

## Bot — production webhook setup

В проде бот работает в webhook-режиме (без long polling). nginx терминирует TLS и проксирует POST на `127.0.0.1:3041/webhook`.

```bash
# 1. Запустить бота с webhook env
TELEGRAM_USE_LONG_POLLING=false \
TELEGRAM_WEBHOOK_SECRET=<random-32+-chars> \
... остальные env ... \
pnpm --filter @letget/bot start

# 2. Зарегистрировать webhook у Telegram
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://letget.example.com/tg/webhook",
    "secret_token": "'"${TELEGRAM_WEBHOOK_SECRET}"'",
    "drop_pending_updates": true
  }'

# 3. Проверить
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Telegram передаёт секрет в заголовке `x-telegram-bot-api-secret-token`. Бот сверяет и при несовпадении возвращает 401. Если секрет не задан — бот логирует warning и принимает все запросы (для локальной отладки за туннелем).

## Deployment to VPS

Прод-домен: `letget.spassonic.ru` (89.208.85.246). Артефакты деплоя в `infra/`.

**Server pre-state:** Ubuntu, nginx, certbot, docker, pnpm, Node 20+, PM2 уже стоят. Юзер `ubuntu` имеет ssh-доступ + sudo на nginx/certbot. Существующий Redis на `localhost:6379` (используем `db=3`).

### Первый деплой (one-time)

```bash
# 1. SSH на VPS
ssh ubuntu@89.208.85.246

# 2. Клонировать репо в /var/www/letget
sudo mkdir -p /var/www/letget && sudo chown ubuntu:ubuntu /var/www/letget
git clone https://github.com/osquaaa/return_toDO.git /var/www/letget
cd /var/www/letget

# 3. Создать пароль для Postgres (это значение пойдёт в db_password.prod.txt И в DB_PASSWORD)
openssl rand -hex 24 > infra/docker/db_password.prod.txt
chmod 600 infra/docker/db_password.prod.txt

# 4. Запустить интерактивный setup-env (попросит DB_PASSWORD из шага 3,
#    RESEND key, TELEGRAM_BOT_TOKEN, ADMIN_EMAIL; auth и webhook secrets сгенерит сам)
bash infra/deploy/setup-env.sh

# 5. Поднять Postgres (docker)
cd infra/docker && docker compose -f docker-compose.prod.yml up -d
cd ../..

# 6. Указать DNS letget.spassonic.ru → 89.208.85.246, дождаться пропагейшна,
#    затем установить nginx vhost + получить SSL
sudo bash infra/deploy/setup-nginx.sh

# 7. Первый деплой: install + migrate + build + pm2
bash infra/deploy/deploy.sh

# 8. Авто-старт PM2 при ребуте
pm2 startup systemd
# (выполнить команду которую он распечатает)
pm2 save

# 9. Ротация логов PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true

# 10. Зарегистрировать webhook у Telegram (TOKEN и WEBHOOK_SECRET из .env.production)
source /var/www/letget/.env.production
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://letget.spassonic.ru/api/telegram/webhook\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"drop_pending_updates\":true}"

# 11. Бэкапы по cron — добавить в crontab юзера ubuntu
mkdir -p ~/logs/letget
crontab -e
# вставить строку:
# 0 3 * * * /var/www/letget/infra/deploy/backup.sh >> ~/logs/letget/backup.log 2>&1
```

### Регулярный деплой

Из `/var/www/letget` на VPS:

```bash
bash infra/deploy/deploy.sh
```

Скрипт делает: `git pull` → `pnpm install --frozen-lockfile` → `pnpm db:migrate` (с `.env.production` подтянутым) → `pnpm -r build` → `pm2 reload`. В конце печатает `pm2 status`.

### Бэкапы

`infra/deploy/backup.sh` дампит Postgres из контейнера через `pg_dump`, гзипает, кладёт в `~/backups/letget/letget-YYYYMMDD-HHMM.sql.gz`. Хранит последние 14 дней.

Cron-строка:

```
0 3 * * * /var/www/letget/infra/deploy/backup.sh >> ~/logs/letget/backup.log 2>&1
```

Шифрование бэкапов at rest — out of scope для Phase 1, запланировано на Phase 1.5.

### Файлы и их роли

| Файл                                   | Назначение                                                               |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `infra/docker/docker-compose.prod.yml` | Postgres 16 контейнер (5440:5432, localhost only, secret-based password) |
| `infra/docker/db_password.prod.txt`    | Пароль БД (gitignored, создаётся локально на сервере)                    |
| `infra/deploy/nginx-letget.conf`       | nginx vhost (443 → 3040 web, /api/telegram/webhook → 3041 bot)           |
| `infra/deploy/setup-nginx.sh`          | Копирует vhost + certbot SSL + reload nginx                              |
| `infra/deploy/ecosystem.config.cjs`    | PM2 конфиг (letget-web на 3040, letget-bot на 3041)                      |
| `infra/deploy/setup-env.sh`            | Интерактивно создаёт `.env.production` (chmod 600, owner ubuntu)         |
| `infra/deploy/deploy.sh`               | Главный скрипт деплоя (pull → install → migrate → build → pm2 reload)    |
| `infra/deploy/backup.sh`               | Дамп Postgres + ротация 14 дней                                          |

## License

Private.
