import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30, unique: true, name: 'booking_code' })
  bookingCode!: string;

  @Index('idx_bookings_rider_status')
  @Column({ type: 'uuid', name: 'rider_id' })
  riderId!: string;

  @Index('idx_bookings_captain_status')
  @Column({ type: 'uuid', name: 'captain_id', nullable: true })
  captainId?: string;

  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId?: string;

  @Column({ type: 'varchar', length: 50, name: 'service_category' })
  serviceCategory!: string;

  @Column({ type: 'varchar', length: 50 })
  status!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'pickup_location',
  })
  pickupLocation!: string | object;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'dropoff_location',
  })
  dropoffLocation!: string | object;

  @Column({ type: 'varchar', length: 4, nullable: true, name: 'start_otp' })
  startOtp?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.0, name: 'fare_amount' })
  fareAmount!: number;

  @Column({ type: 'uuid', nullable: true, name: 'quote_id' })
  quoteId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'fare_rule_id' })
  fareRuleId?: string;

  @Column({ type: 'int', nullable: true, name: 'fare_rule_version' })
  fareRuleVersion?: number;

  @Index('idx_bookings_idempotency')
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'idempotency_key' })
  idempotencyKey?: string | null;

  @Column({ type: 'int', default: 1, name: 'passenger_count' })
  passengerCount!: number;

  // Transition timestamps & tracking (EV-038)
  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'requested_at' })
  requestedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'dispatching_at' })
  dispatchingAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'assigned_at' })
  assignedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'arrived_at' })
  arrivedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'trip_started_at' })
  tripStartedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'trip_completed_at' })
  tripCompletedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'cancelled_by_role' })
  cancelledByRole?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'cancelled_by_id' })
  cancelledById?: string | null;

  @Column({ type: 'bigint', default: 0, name: 'cancellation_fee_paise' })
  cancellationFeePaise!: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'failed_at' })
  failedAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'failure_reason' })
  failureReason?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
