import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { DriverProfile } from './driver-profile.entity';
import { Vehicle } from './vehicle.entity';
import { ComplianceWarningTier, ComplianceTargetType } from '@ecoride/contracts';

@Entity('compliance_warnings')
@Check(
  'chk_compliance_warnings_tier',
  `"warning_tier" IN ('WARNING_30D', 'WARNING_15D', 'WARNING_7D', 'WARNING_1D', 'EXPIRED')`,
)
@Check(
  'chk_compliance_warnings_target_type',
  `"target_type" IN ('DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT')`,
)
export class ComplianceWarning {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_compliance_warnings_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_compliance_warnings_driver_id')
  @Column({ type: 'uuid', nullable: true, name: 'driver_profile_id' })
  driverProfileId?: string | null;

  @ManyToOne(() => DriverProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_profile_id' })
  driverProfile?: DriverProfile | null;

  @Index('idx_compliance_warnings_vehicle_id')
  @Column({ type: 'uuid', nullable: true, name: 'vehicle_id' })
  vehicleId?: string | null;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle | null;

  @Column({ type: 'varchar', length: 50, name: 'target_type' })
  targetType!: ComplianceTargetType | string;

  @Column({ type: 'varchar', length: 100, name: 'target_identifier' })
  targetIdentifier!: string;

  @Column({ type: 'timestamptz', name: 'expiry_date' })
  expiryDate!: Date;

  @Column({ type: 'int', name: 'days_remaining' })
  daysRemaining!: number;

  @Index('idx_compliance_warnings_tier')
  @Column({ type: 'varchar', length: 30, name: 'warning_tier' })
  warningTier!: ComplianceWarningTier | string;

  @Index('idx_compliance_warnings_resolved')
  @Column({ type: 'boolean', default: false, name: 'is_resolved' })
  isResolved!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'resolution_type' })
  resolutionType?: string | null;

  @Column({ type: 'text', name: 'action_required' })
  actionRequired!: string;

  @Index('idx_compliance_warnings_created_at')
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

