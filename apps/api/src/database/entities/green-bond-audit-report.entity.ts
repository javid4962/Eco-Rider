import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { GreenBondAuditStatus } from '@ecoride/contracts';

@Entity('green_bond_audit_reports')
@Index('idx_green_bond_report_period_hash', ['reportingPeriod', 'bondSeriesId'])
export class GreenBondAuditReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporting_period', type: 'varchar', length: 32 })
  reportingPeriod: string;

  @Column({ name: 'bond_series_id', type: 'varchar', length: 64 })
  bondSeriesId: string;

  @Column({ name: 'total_clean_km_traveled', type: 'float' })
  totalCleanKmTraveled: number;

  @Column({ name: 'total_kwh_consumed', type: 'float' })
  totalKwhConsumed: number;

  @Column({ name: 'solar_wind_share_percent', type: 'float' })
  solarWindSharePercent: number;

  @Column({ name: 'displaced_diesel_liters', type: 'float' })
  displacedDieselLiters: number;

  @Column({ name: 'avoided_co2_emissions_metric_tons', type: 'float' })
  avoidedCo2EmissionsMetricTons: number;

  @Column({ name: 'green_jobs_generated_count', type: 'int' })
  greenJobsGeneratedCount: number;

  @Column({ name: 'capital_expenditure_paise', type: 'bigint' })
  capitalExpenditurePaise: string;

  @Column({ name: 'bond_proceeds_allocated_paise', type: 'bigint' })
  bondProceedsAllocatedPaise: string;

  @Column({ name: 'compliance_ratio_bps', type: 'int', default: 10000 })
  complianceRatioBps: number;

  @Column({ name: 'tamper_proof_certificate_sha256', type: 'varchar', length: 64 })
  tamperProofCertificateSha256: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: GreenBondAuditStatus,
    default: GreenBondAuditStatus.CAG_AUDITED,
  })
  status: GreenBondAuditStatus;

  @CreateDateColumn({ name: 'audited_at' })
  auditedAt: Date;
}

