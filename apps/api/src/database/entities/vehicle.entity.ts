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
import { FleetOrganization } from './fleet-organization.entity';
import {
  PropulsionType,
  VehicleCategory,
  VehicleServiceClass,
  RangeTelemetrySource,
  VehicleVerificationStatus,
} from '@ecoride/contracts';

@Entity('vehicles')
@Check(`"propulsion_type" = 'BATTERY_ELECTRIC'`)
@Check(`"current_soc_percent" >= 0.00 AND "current_soc_percent" <= 100.00`)
@Check(`"approved_passenger_seating" >= 1 AND "approved_passenger_seating" <= 10`)
@Check(`"total_seating_capacity" = "approved_passenger_seating" + 1`)
@Check(`"rated_range_km" > 0`)
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_vehicles_registration', { unique: true })
  @Column({ type: 'varchar', length: 30, unique: true, name: 'registration_number' })
  registrationNumber!: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'propulsion_type',
    default: PropulsionType.BATTERY_ELECTRIC,
  })
  propulsionType!: PropulsionType.BATTERY_ELECTRIC | string;

  @Index('idx_vehicles_category')
  @Column({
    type: 'varchar',
    length: 50,
    name: 'vehicle_category',
    default: VehicleCategory.CITY_COMMUTE_2W,
  })
  vehicleCategory: VehicleCategory | string = VehicleCategory.CITY_COMMUTE_2W;

  @Index('idx_vehicles_service_class')
  @Column({
    type: 'varchar',
    length: 50,
    name: 'service_class',
    default: VehicleServiceClass.ECO_BIKE,
  })
  serviceClass: VehicleServiceClass | string = VehicleServiceClass.ECO_BIKE;

  @Index('idx_vehicles_seating_config')
  @Column({
    type: 'varchar',
    length: 20,
    name: 'seating_configuration',
    default: 'D+1',
  })
  seatingConfiguration: string = 'D+1';

  @Column({
    type: 'int',
    name: 'total_seating_capacity',
    default: 2,
  })
  totalSeatingCapacity: number = 2;

  @Column({ type: 'varchar', length: 100, default: 'Ather Energy' })
  make!: string;

  @Column({ type: 'varchar', length: 100, default: '450X' })
  model!: string;

  @Column({ type: 'int', name: 'year_of_manufacture', default: 2024 })
  yearOfManufacture!: number;

  @Column({ type: 'int', name: 'approved_passenger_seating', default: 1 })
  approvedPassengerSeating!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'battery_capacity_kwh' })
  batteryCapacityKwh!: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'current_soc_percent',
    default: 100.0,
  })
  currentSocPercent!: number;

  @Column({ type: 'int', name: 'rated_range_km', default: 110 })
  ratedRangeKm!: number;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'range_telemetry_source',
    default: RangeTelemetrySource.OBD_TELEMATICS,
  })
  rangeTelemetrySource!: RangeTelemetrySource | string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'telemetry_device_id' })
  telemetryDeviceId?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'telemetry_last_ping_at' })
  telemetryLastPingAt?: Date | null;

  @Index('idx_vehicles_owner_id')
  @Column({ type: 'uuid', nullable: true, name: 'owner_id' })
  ownerId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner?: User | null;

  @Index('idx_vehicles_fleet_org_id')
  @Column({ type: 'uuid', nullable: true, name: 'fleet_organization_id' })
  fleetOrganizationId?: string | null;

  @ManyToOne(() => FleetOrganization, (org) => org.vehicles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fleet_organization_id' })
  fleetOrganization?: FleetOrganization | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'insurance_policy_number' })
  insurancePolicyNumber?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'insurance_expiry_date' })
  insuranceExpiryDate?: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'fitness_certificate_number' })
  fitnessCertificateNumber?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'fitness_expiry_date' })
  fitnessExpiryDate?: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'commercial_permit_number' })
  commercialPermitNumber?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'commercial_permit_expiry' })
  commercialPermitExpiry?: Date | null;

  @Column({ type: 'boolean', default: true, name: 'green_plate_verified' })
  greenPlateVerified!: boolean;

  @Index('idx_vehicles_verification_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: VehicleVerificationStatus.VERIFIED,
    name: 'verification_status',
  })
  verificationStatus!: VehicleVerificationStatus | string;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string | null;

  @Index('idx_vehicles_city')
  @Column({ type: 'varchar', length: 50, default: 'visakhapatnam' })
  city!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  /**
   * Evaluates real-time regulatory compliance and roadworthiness.
   */
  get isRoadworthy(): boolean {
    if (
      !this.isActive ||
      !this.greenPlateVerified ||
      this.verificationStatus !== VehicleVerificationStatus.VERIFIED
    ) {
      return false;
    }
    const now = new Date();
    if (this.insuranceExpiryDate && new Date(this.insuranceExpiryDate).getTime() < now.getTime()) {
      return false;
    }
    if (this.fitnessExpiryDate && new Date(this.fitnessExpiryDate).getTime() < now.getTime()) {
      return false;
    }
    if (
      this.commercialPermitExpiry &&
      new Date(this.commercialPermitExpiry).getTime() < now.getTime()
    ) {
      return false;
    }
    return true;
  }

  /**
   * Computes estimated remaining range based on battery SoC and rated range.
   */
  get estimatedRangeKm(): number {
    const socFraction = Math.max(0, Math.min(100, Number(this.currentSocPercent))) / 100;
    return Math.round(Number(this.ratedRangeKm) * socFraction);
  }

  /**
   * Strictly accounts for the driver separately (driver seat = 1).
   */
  get driverSeatCount(): number {
    return 1;
  }

  /**
   * Authoritative legal passenger capacity for customers, accounting for driver separately.
   */
  get legalPassengerCapacity(): number {
    return Number(this.approvedPassengerSeating);
  }
}
