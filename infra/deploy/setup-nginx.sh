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
