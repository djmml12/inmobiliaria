#!/usr/bin/env bash
# Respaldo diario de PostgreSQL hacia almacenamiento externo.
# Configurar en cron: 0 2 * * * /infra/scripts/backup.sh >> /var/log/backup.log 2>&1

set -euo pipefail

FECHA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backups"
ARCHIVO="inmobiliaria_${FECHA}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[${FECHA}] Iniciando respaldo..."

# Volcar la base de datos
docker compose -f "$(dirname "$0")/../docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-postgres}" inmobiliaria \
  | gzip > "${BACKUP_DIR}/${ARCHIVO}"

echo "[${FECHA}] Respaldo creado: ${BACKUP_DIR}/${ARCHIVO}"

# TODO: copiar a almacenamiento externo (DigitalOcean Spaces, S3, etc.)
# Ejemplo con rclone:
# rclone copy "${BACKUP_DIR}/${ARCHIVO}" spaces:mi-bucket/backups/

# Limpiar backups locales de más de 7 días
find "$BACKUP_DIR" -name "inmobiliaria_*.sql.gz" -mtime +7 -delete

echo "[${FECHA}] Respaldo completado."
