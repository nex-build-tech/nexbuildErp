#!/usr/bin/env bash
# ==============================================================================
# BuildERP - Production Daily MySQL Backup Script
# Tenant: Kings Builders & Developers & Multi-Tenant Databases
# ==============================================================================
set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-builderp}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/builderp/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "▶ Starting automated MySQL backup for database '${DB_NAME}'..."
START_TIME=$(date +%s)

# Execute mysqldump with single-transaction, routines, and gzip compression
MYSQL_PWD="${DB_PASS}" mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

# Generate SHA256 Checksum
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

log "✅ Backup completed successfully in ${DURATION}s: ${BACKUP_FILE} (Size: ${FILE_SIZE})"

# Automated retention rotation: Remove backups older than RETENTION_DAYS
log "🧹 Rotating archives: Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz*" -type f -mtime "+${RETENTION_DAYS}" -exec rm -f {} +
log "✔ Archive retention maintenance finished."

# Optional AWS S3 upload (uncomment in production if AWS CLI is configured)
# if command -v aws &> /dev/null && [ -n "${S3_BACKUP_BUCKET:-}" ]; then
#     log "☁ Uploading archive to s3://${S3_BACKUP_BUCKET}/backups/${DB_NAME}/..."
#     aws s3 cp "${BACKUP_FILE}" "s3://${S3_BACKUP_BUCKET}/backups/${DB_NAME}/"
#     aws s3 cp "${BACKUP_FILE}.sha256" "s3://${S3_BACKUP_BUCKET}/backups/${DB_NAME}/"
# fi

log "🎉 Daily backup workflow finalized."
