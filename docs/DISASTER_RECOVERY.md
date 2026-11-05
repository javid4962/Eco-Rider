# EcoRide Disaster Recovery & Business Continuity Plan (M24)

## 1. Objectives & Metrics
- **Recovery Point Objective (RPO)**: < 5 minutes (via PostgreSQL continuous archiving & WAL replication).
- **Recovery Time Objective (RTO)**: < 30 minutes (automated container failover and point-in-time restore).
- **Jurisdiction**: Primary AWS / MeitY-empaneled data center in Hyderabad / Amaravathi, AP.
- **Failover Target**: Secondary standby region in Mumbai / Chennai.

## 2. Backup Architecture
1. **Automated Nightly Base Backups**: `scripts/backup-db.sh` runs at 02:00 AM IST daily.
2. **Continuous WAL Archiving**: PostgreSQL WAL files streamed to encrypted S3 / object storage bucket with object lock.
3. **Immutable Checksums**: Every dump is paired with a SHA-256 integrity digest.
4. **Retention Policy**:
   - Daily backups: 30 days retention.
   - Monthly backups: 12 months retention (statutory tax compliance under AP GST rules).

## 3. Disaster Recovery Drill Runbook
1. **Detection**: Alert triggered by Prometheus / Alertmanager or CloudWatch (Database replica lag > 60s or primary offline).
2. **Declaration**: Incident Commander declares Level 1 Disaster.
3. **Execution**:
   ```bash
   # On standby server
   bash scripts/restore-db.sh /var/backups/ecoride/ecoride_db_latest.dump
   ```
4. **Verification**:
   - Run database migration verification: `pnpm --filter api test -- test/migration.spec.ts`
   - Run adversarial concurrency checks: `pnpm --filter api test -- test/adversarial-concurrency.spec.ts`
   - Healthcheck probe: `curl -f http://localhost:3000/health`
5. **DNS Traffic Shift**: Update Route53 / Cloudflare DNS records for `api.ecoride.in` pointing to secondary VIP.

