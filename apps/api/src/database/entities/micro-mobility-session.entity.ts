import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('micro_mobility_sessions')
export class MicroMobilitySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Index()
  @Column({ name: 'vehicle_code', type: 'varchar', length: 64 })
  vehicleCode: string;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 32 })
  vehicleType: string;

  @Column({ name: 'origin_dock_id', type: 'varchar', length: 64 })
  originDockId: string;

  @Column({ name: 'destination_dock_id', type: 'varchar', length: 64, nullable: true })
  destinationDockId: string | null;

  @Column({ type: 'varchar', length: 32, default: 'UNLOCKED' })
  status: string;

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ name: 'distance_meters', type: 'int', default: 0 })
  distanceMeters: number;

  @Column({ name: 'base_unlock_fee_paise', type: 'int', default: 1000 })
  baseUnlockFeePaise: number;

  @Column({ name: 'per_minute_fee_paise', type: 'int', default: 200 })
  perMinuteFeePaise: number;

  @Column({ name: 'gst_paise', type: 'int', default: 0 })
  gstPaise: number;

  @Column({ name: 'total_charged_paise', type: 'int', default: 0 })
  totalChargedPaise: number;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}

