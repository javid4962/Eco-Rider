import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { DriverComplianceStatus, DutyStatus } from '@ecoride/contracts';

export type VerificationStatus =
  'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';

@Entity('driver_profiles')
@Check(
  'chk_driver_profiles_compliance_status',
  `"verification_status" IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'EXPIRED')`,
)
@Check('chk_driver_profiles_duty_status', `"duty_status" IN ('ONLINE', 'OFFLINE', 'ON_TRIP')`)
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_driver_profiles_user_id', { unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.driverProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_driver_profiles_license', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'license_number' })
  licenseNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'badge_number' })
  badgeNumber?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'license_expiry_date' })
  licenseExpiryDate?: Date | null;

  @Index('idx_driver_profiles_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: DriverComplianceStatus.PENDING,
    name: 'verification_status',
  })
  verificationStatus!: DriverComplianceStatus | string;

  @Index('idx_driver_profiles_duty_status')
  @Column({
    type: 'varchar',
    length: 20,
    default: DutyStatus.OFFLINE,
    name: 'duty_status',
  })
  dutyStatus!: DutyStatus | string;

  @Column({ type: 'timestamptz', nullable: true, name: 'duty_last_toggled_at' })
  dutyLastToggledAt?: Date | null;

  @Column({ type: 'text', nullable: true, name: 'suspension_reason' })
  suspensionReason?: string | null;

  @Column({ type: 'text', nullable: true, name: 'compliance_notes' })
  complianceNotes?: string | null;

  @Column({ type: 'boolean', default: false, name: 'green_plate_permit_verified' })
  greenPlatePermitVerified!: boolean;

  @Column({ type: 'boolean', default: false, name: 'safety_training_completed' })
  safetyTrainingCompleted!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'visakhapatnam' })
  city!: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_vehicle_id' })
  assignedVehicleId?: string;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_vehicle_id' })
  assignedVehicle?: Vehicle;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5.0, name: 'rating_average' })
  ratingAverage!: number;

  @Column({ type: 'int', default: 0, name: 'total_trips' })
  totalTrips!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
