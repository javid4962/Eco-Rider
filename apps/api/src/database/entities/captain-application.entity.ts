import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { CaptainApplicationReview } from './captain-application-review.entity';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleOwnershipType,
  VehicleCategory,
  PropulsionType,
} from '@ecoride/contracts';

@Entity('captain_applications')
@Check(`"propulsion_type" = 'BATTERY_ELECTRIC'`)
export class CaptainApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_captain_apps_user_id', { unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_captain_apps_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: CaptainApplicationStatus.DRAFT,
  })
  status!: CaptainApplicationStatus | string;

  // ---------------------------------------------------------------------------
  // Independently Verified Driver Requirements
  // ---------------------------------------------------------------------------

  @Column({
    type: 'varchar',
    length: 30,
    name: 'driver_requirements_status',
    default: RequirementStatus.PENDING,
  })
  driverRequirementsStatus!: RequirementStatus | string;

  @Column({ type: 'text', nullable: true, name: 'driver_rejection_reason' })
  driverRejectionReason?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'full_name' })
  fullName?: string | null;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth?: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'driving_license_number' })
  drivingLicenseNumber?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'driving_license_expiry' })
  drivingLicenseExpiry?: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'badge_number' })
  badgeNumber?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'driving_license_doc_id' })
  drivingLicenseDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'aadhaar_doc_id' })
  aadhaarDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'pan_doc_id' })
  panDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'police_verification_doc_id' })
  policeVerificationDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'profile_photo_doc_id' })
  profilePhotoDocId?: string | null;

  // ---------------------------------------------------------------------------
  // Independently Verified Vehicle Requirements
  // ---------------------------------------------------------------------------

  @Column({
    type: 'varchar',
    length: 30,
    name: 'vehicle_requirements_status',
    default: RequirementStatus.PENDING,
  })
  vehicleRequirementsStatus!: RequirementStatus | string;

  @Column({ type: 'text', nullable: true, name: 'vehicle_rejection_reason' })
  vehicleRejectionReason?: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'vehicle_ownership_type',
    default: VehicleOwnershipType.OWNED,
  })
  vehicleOwnershipType!: VehicleOwnershipType | string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'vehicle_category',
    default: VehicleCategory.CITY_COMMUTE_2W,
  })
  vehicleCategory!: VehicleCategory | string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'propulsion_type',
    default: PropulsionType.BATTERY_ELECTRIC,
  })
  propulsionType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'vehicle_make' })
  vehicleMake?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'vehicle_model' })
  vehicleModel?: string | null;

  @Column({ type: 'int', nullable: true, name: 'vehicle_year' })
  vehicleYear?: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true, name: 'vehicle_registration_number' })
  vehicleRegistrationNumber?: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, name: 'battery_capacity_kwh' })
  batteryCapacityKwh?: number | null;

  @Column({ type: 'uuid', nullable: true, name: 'vehicle_rc_doc_id' })
  vehicleRcDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'green_plate_permit_doc_id' })
  greenPlatePermitDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'insurance_doc_id' })
  insuranceDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'fitness_doc_id' })
  fitnessDocId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'created_vehicle_id' })
  createdVehicleId?: string | null;

  // ---------------------------------------------------------------------------
  // Operational Governance & Metadata
  // ---------------------------------------------------------------------------

  @Index('idx_captain_apps_city')
  @Column({ type: 'varchar', length: 50, default: 'visakhapatnam' })
  city!: string;

  @Column({ type: 'int', default: 0, name: 'submission_count' })
  submissionCount!: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'last_reviewer_id' })
  lastReviewerId?: string | null;

  @Column({ type: 'text', nullable: true, name: 'overall_rejection_reason' })
  overallRejectionReason?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => CaptainApplicationReview, (review) => review.application, { cascade: true })
  reviews?: CaptainApplicationReview[];
}
