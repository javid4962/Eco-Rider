import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('ride_state_events')
export class RideStateEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_ride_state_events_booking_created')
  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'from_status' })
  fromStatus?: string | null;

  @Index('idx_ride_state_events_to_status')
  @Column({ type: 'varchar', length: 50, name: 'to_status' })
  toStatus!: string;

  @Index('idx_ride_state_events_actor')
  @Column({ type: 'uuid', name: 'actor_id' })
  actorId!: string;

  @Column({ type: 'varchar', length: 50, name: 'actor_role' })
  actorRole!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
