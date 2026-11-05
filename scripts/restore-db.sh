#!/usr/bin/env bash
# EcoRide Andhra Pradesh Database Restore Script (M24)
# Disaster Recovery Restore with Integrity Verification
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup.dump>"
  exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file ${BACKUP_FILE} does not exist"
  exit 1
fi

if [ -f "${CHECKSUM_FILE}" ]; then
  echo "Verifying SHA256 integrity checksum..."
  sha256sum -c "${CHECKSUM_FILE}"
else
  echo "Warning: Checksum file not found, proceeding with caution."
fi

echo "Starting restoration into target database..."
export PGPASSWORD="${DB_PASSWORD:-postgres}"
pg_restore \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-postgres}" \
  -d "${DB_NAME:-ecoride}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v "${BACKUP_FILE}"

echo "Database restore completed successfully."

