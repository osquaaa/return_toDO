#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y%m%d-%H%M)
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/letget}"
mkdir -p "$BACKUP_DIR"

# Дамп из postgres-контейнера
docker exec letget-postgres-prod pg_dump -U letget letget | gzip > "$BACKUP_DIR/letget-$DATE.sql.gz"

# Храним последние 14 дней
find "$BACKUP_DIR" -name 'letget-*.sql.gz' -mtime +14 -delete

echo "✓ Backup: $BACKUP_DIR/letget-$DATE.sql.gz"
