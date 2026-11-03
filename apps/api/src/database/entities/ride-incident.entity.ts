import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('ride_incidents')
export class RideIncident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_ride_incidents_booking_id')
  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @Index('idx_ride_incidents_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'incident_code' })
  incidentCode!: string;

  @Column({ type: 'varchar', length: 50, name: 'incident_type' })
  incidentType!: string;

  @Column({ type: 'varchar', length: 20, default: 'MEDIUM' })
  severity!: string;

  @Index('idx_ride_incidents_status')
  @Column({ type: 'varchar', length: 30, default: 'REPORTED' })
  status!: string;

  @Column({ type: 'uuid', name: 'reported_by_id' })
  reportedById!: string;

  @Column({ type: 'varchar', length: 50, name: 'reported_by_role' })
  reportedByRole!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
