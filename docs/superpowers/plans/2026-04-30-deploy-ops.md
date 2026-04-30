# Deploy + Ops Implementation Plan

> Concise. Sets up VPS deployment artifacts (nginx, PM2, docker-compose prod, deploy script, backup script). Most of the work is config files — no app code changes.

**Goal:** Make Phase 1 deployable to the user's VPS at `89.208.85.246` under `letget.spassonic.ru`.

**Server pre-state expected:**

- Ubuntu with nginx, certbot, docker, pnpm, node 20+, pm2 installed
- User `ubuntu` has SSH access, sudo for nginx/certbot
- Existing Redis container on `localhost:6379` (we use db=3)

---

## Task 1: docker-compose.prod.yml

**Files:**

- Create: `infra/docker/docker-compose.prod.yml`
- Create: `infra/docker/db_password.prod.txt` (gitignored — placeholder note)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: letget-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: letget
      POSTGRES_DB: letget
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - letget-postgres-prod:/var/lib/postgresql/data
    ports:
      - '127.0.0.1:5440:5432'
    secrets:
      - db_password
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'letget']
      interval: 30s
      timeout: 5s
      retries: 5

volumes:
  letget-postgres-prod:

secrets:
  db_password:
    file: ./db_password.prod.txt
```

Add to `.gitignore`: `infra/docker/db_password.prod.txt`.

Commit: `infra: docker-compose prod with postgres + secrets`

---

## Task 2: Nginx vhost + SSL setup

**Files:**

- Create: `infra/deploy/nginx-letget.conf` — the vhost config (verbatim from spec section 10)
- Create: `infra/deploy/setup-nginx.sh` — interactive script that copies vhost, runs certbot, reloads nginx

`setup-nginx.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DOMAIN="letget.spassonic.ru"
VHOST_SRC="$(dirname "$0")/nginx-letget.conf"
VHOST_DST="/etc/nginx/sites-available/letget.conf"

echo "→ Установка vhost для $DOMAIN"
sudo cp "$VHOST_SRC" "$VHOST_DST"
sudo ln -sf "$VHOST_DST" /etc/nginx/sites-enabled/letget.conf
sudo nginx -t

echo "→ Получение SSL через certbot"
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "${ADMIN_EMAIL:-igopexa61994@gmail.com}" --redirect

sudo systemctl reload nginx
echo "✓ Готово"
```

Document in README that this script must be run as `sudo bash setup-nginx.sh` after DNS is pointed.

Commit: `infra: nginx vhost + setup script`

---

## Task 3: PM2 ecosystem + setup-env script

**Files:**

- Create: `infra/deploy/ecosystem.config.cjs` (verbatim from spec, with .cjs extension since project is type:module)
- Create: `infra/deploy/setup-env.sh` — interactive script that prompts for each secret + writes `.env.production` with chmod 600

`setup-env.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

DEST="/var/www/letget/.env.production"
TMPL="$(dirname "$0")/env.production.template"

echo "→ Создаю $DEST (chmod 600)"

# Generate auth secret
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 16)

read -p "DB_PASSWORD (новый, 24 chars random): " -s DB_PASSWORD
echo
read -p "RESEND_API_KEY: " RESEND_API_KEY
read -p "TELEGRAM_BOT_TOKEN: " -s TELEGRAM_BOT_TOKEN
echo
read -p "ADMIN_EMAIL [igopexa61994@gmail.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-igopexa61994@gmail.com}

cat > "$DEST" <<EOF
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=5440
DB_NAME=letget
DB_USER=letget
DB_PASSWORD=$DB_PASSWORD
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=3
APP_URL=https://letget.spassonic.ru
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
RESEND_API_KEY=$RESEND_API_KEY
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME=letget_bot
TELEGRAM_WEBHOOK_SECRET=$TELEGRAM_WEBHOOK_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
EOF
chmod 600 "$DEST"
chown ubuntu:ubuntu "$DEST"
echo "✓ Готово. BETTER_AUTH_SECRET и TELEGRAM_WEBHOOK_SECRET сгенерированы автоматически."
echo "✓ Сохрани их в password manager."
```

Commit: `infra: pm2 ecosystem + setup-env script`

---

## Task 4: Deploy script

**File:** `infra/deploy/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run on the VPS as `ubuntu` user from /var/www/letget
cd "$(dirname "$0")/../.."

echo "→ Pull from origin"
git pull --ff-only

echo "→ Install deps (frozen)"
pnpm install --frozen-lockfile

echo "→ Run migrations"
set -a; source .env.production; set +a
pnpm db:migrate

echo "→ Build"
pnpm -r build

echo "→ Reload PM2"
pm2 reload infra/deploy/ecosystem.config.cjs --update-env

echo "✓ Deploy complete"
pm2 status
```

Document in README how to run it: `bash infra/deploy/deploy.sh`.

Commit: `infra: deploy script`

---

## Task 5: Backup script + cron

**File:** `infra/deploy/backup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y%m%d-%H%M)
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/letget}"
mkdir -p "$BACKUP_DIR"

# Dump from postgres container
docker exec letget-postgres-prod pg_dump -U letget letget | gzip > "$BACKUP_DIR/letget-$DATE.sql.gz"

# Keep last 14 days
find "$BACKUP_DIR" -name 'letget-*.sql.gz' -mtime +14 -delete

echo "✓ Backup: $BACKUP_DIR/letget-$DATE.sql.gz"
```

Cron entry to add (document in README):

```
0 3 * * * /var/www/letget/infra/deploy/backup.sh >> ~/logs/letget/backup.log 2>&1
```

Commit: `infra: backup script + cron docs`

---

## Task 6: First-deploy README + tag

**File:** Modify `README.md` — add "Deployment to VPS" section with the full first-time-setup playbook:

1. SSH to VPS
2. Clone repo to `/var/www/letget`
3. Run `infra/deploy/setup-env.sh`
4. Run `cd infra/docker && docker compose -f docker-compose.prod.yml up -d`
5. Run `infra/deploy/setup-nginx.sh` (after pointing DNS)
6. Run `infra/deploy/deploy.sh` (does install + migrate + build + pm2)
7. `pm2 startup systemd` (auto-start on reboot)
8. `pm2 install pm2-logrotate` (logs rotation)
9. Set up Telegram webhook: `curl -X POST "https://api.telegram.org/bot$TOKEN/setWebhook" -d "url=https://letget.spassonic.ru/api/telegram/webhook&secret_token=$WEBHOOK_SECRET"`
10. Add backup cron: `crontab -e` → paste cron entry

Tag: `git tag plan8-complete -m "Plan 8 done: deploy + ops"`

Then `git tag phase1-complete -m "Phase 1 ready for production deploy"`

Commit: `docs: deployment playbook in readme`

---

## Conventions

- Scripts use `set -euo pipefail` for safety.
- All sensitive ops (env setup, password generation) are interactive — no automation that could leak.
- No raw SSH keys in repo.
- Backups encrypted at rest? — out of scope for Phase 1, document for Phase 1.5.
