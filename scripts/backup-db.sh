#!/usr/bin/env bash
# EcoRide Andhra Pradesh Database Backup Script (M24)
# Automated Point-In-Time Backup for PostgreSQL / PostGIS
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ecoride}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ecoride_db_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting EcoRide database backup..." | tee -a "${LOG_FILE}"

export PGPASSWORD="${DB_PASSWORD:-postgres}"
pg_dump \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-postgres}" \
  -d "${DB_NAME:-ecoride}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}" 2>> "${LOG_FILE}"

# Compute SHA256 checksum for integrity verification
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

# Retain backups for 30 days
find "${BACKUP_DIR}" -name "ecoride_db_*.dump" -mtime +30 -delete

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed successfully: ${BACKUP_FILE}" | tee -a "${LOG_FILE}"

