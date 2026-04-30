#!/usr/bin/env bash
set -euo pipefail

DEST="/var/www/letget/.env.production"

echo "→ Создаю $DEST (chmod 600)"

# Генерируем секреты автоматически
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 16)

read -rsp "Введи DB_PASSWORD (24 случайных символа): " DB_PASSWORD
echo
read -rsp "Введи RESEND key: " RESEND_API_KEY
echo
read -rsp "Введи TELEGRAM_BOT_TOKEN: " TELEGRAM_BOT_TOKEN
echo
read -rp "ADMIN_EMAIL [igopexa61994@gmail.com]: " ADMIN_EMAIL
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
