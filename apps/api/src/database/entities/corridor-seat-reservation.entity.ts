import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CorridorReservationStatus } from '@ecoride/contracts';

@Entity('corridor_seat_reservations')
export class CorridorSeatReservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corridor_reservations_trip')
  @Column({ type: 'uuid', name: 'trip_id' })
  tripId!: string;

  @Index('idx_corridor_reservations_rider')
  @Column({ type: 'uuid', name: 'rider_id' })
  riderId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'booking_id' })
  bookingId?: string | null;

  @Column({ type: 'int', name: 'from_stop_sequence' })
  fromStopSequence!: number;

  @Column({ type: 'varchar', length: 100, name: 'from_stop_name' })
  fromStopName!: string;

  @Column({ type: 'int', name: 'to_stop_sequence' })
  toStopSequence!: number;

  @Column({ type: 'varchar', length: 100, name: 'to_stop_name' })
  toStopName!: string;

  @Column({ type: 'int', name: 'seat_number' })
  seatNumber!: number;

  @Index('idx_corridor_reservations_pass_code', { unique: true })
  @Column({ type: 'varchar', length: 20, unique: true, name: 'boarding_pass_code' })
  boardingPassCode!: string;

  @Column({ type: 'bigint', name: 'fare_paise' })
  farePaise!: number;

  @Index('idx_corridor_reservations_idempotency', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'idempotency_key' })
  idempotencyKey!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: CorridorReservationStatus.CONFIRMED,
    name: 'status',
  })
  status!: CorridorReservationStatus | string;

  @Column({ type: 'boolean', default: false, name: 'checked_in' })
  checkedIn!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'checked_in_at' })
  checkedInAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

