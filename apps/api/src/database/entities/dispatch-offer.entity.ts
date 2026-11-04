import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Booking } from './booking.entity';
import { DriverProfile } from './driver-profile.entity';
import { Vehicle } from './vehicle.entity';

@Entity('dispatch_offers')
@Check(
  'chk_dispatch_offers_status',
  `"status" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'TIMED_OUT', 'SUPERSEDED', 'CANCELLED')`,
)
@Index('idx_dispatch_offers_booking_seq', ['bookingId', 'offerSequence'])
@Index('idx_dispatch_offers_captain_status', ['captainId', 'status'])
@Index('idx_dispatch_offers_status_expires', ['status', 'expiresAt'])
export class DispatchOffer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_dispatch_offers_booking_id')
  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @Index('idx_dispatch_offers_captain_id')
  @Column({ type: 'uuid', name: 'captain_id' })
  captainId!: string;

  @ManyToOne(() => DriverProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'captain_id' })
  captain?: DriverProfile;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Column({ type: 'int', default: 1, name: 'offer_sequence' })
  offerSequence!: number;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'offered_at' })
  offeredAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'responded_at' })
  respondedAt?: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'decline_reason' })
  declineReason?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'timeout_job_id' })
  timeoutJobId?: string | null;

  @Column({ type: 'int', default: 15, name: 'offer_timeout_seconds' })
  offerTimeoutSeconds!: number;

  @Column({ type: 'int', default: 0, name: 'estimated_pickup_distance_meters' })
  estimatedPickupDistanceMeters!: number;

  @Column({ type: 'int', default: 0, name: 'estimated_pickup_duration_seconds' })
  estimatedPickupDurationSeconds!: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
