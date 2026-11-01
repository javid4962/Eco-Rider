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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

