#!/usr/bin/env bash
set -euo pipefail

# Запускается на VPS из-под ubuntu из /var/www/letget
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
