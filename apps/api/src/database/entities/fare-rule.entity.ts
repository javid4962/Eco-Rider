import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { FarePromotionConfig, FareRuleStatus } from '@ecoride/contracts';

@Entity('fare_rules')
@Unique(['city', 'serviceCategory', 'version'])
@Index('idx_fare_rules_lookup', ['city', 'serviceCategory', 'status', 'effectiveFrom'])
export class FareRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'rule_code' })
  ruleCode!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Column({ type: 'varchar', length: 50, name: 'service_category' })
  serviceCategory!: string;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status!: FareRuleStatus;

  @Column({ type: 'int', name: 'base_fare_paise' })
  baseFarePaise!: number;

  @Column({ type: 'int', default: 1000, name: 'base_distance_meters' })
  baseDistanceMeters!: number;

  @Column({ type: 'int', name: 'per_km_rate_paise' })
  perKmRatePaise!: number;

  @Column({ type: 'int', default: 0, name: 'per_minute_rate_paise' })
  perMinuteRatePaise!: number;

  @Column({ type: 'int', default: 0, name: 'waiting_charge_paise_per_minute' })
  waitingChargePaisePerMinute!: number;

  @Column({ type: 'int', default: 2500, name: 'minimum_fare_paise' })
  minimumFarePaise!: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 1.0, name: 'surge_multiplier' })
  surgeMultiplier!: number;

  @Column({ type: 'int', default: 500, name: 'tax_rate_bps' })
  taxRateBps!: number; // 500 basis points = 5.00% GST

  @Column({ type: 'int', default: 1500, name: 'commission_rate_bps' })
  commissionRateBps!: number; // 1500 basis points = 15.00%

  @Column({ type: 'jsonb', nullable: true })
  promotions?: FarePromotionConfig[] | null;

  @Column({ type: 'timestamptz', name: 'effective_from' })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'effective_to' })
  effectiveTo?: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_illustrative' })
  isIllustrative!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
  createdById?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by_id' })
  approvedById?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'evidence_reference' })
  evidenceReference?: string | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
