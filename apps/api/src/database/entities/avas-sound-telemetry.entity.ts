import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('avas_sound_telemetries')
export class AvasSoundTelemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'speed_kmph', type: 'numeric', precision: 5, scale: 2 })
  speedKmph: number;

  @Column({ name: 'acoustic_chime_db', type: 'numeric', precision: 5, scale: 2 })
  acousticChimeDb: number;

  @Column({ name: 'is_chime_enabled', type: 'boolean', default: true })
  isChimeEnabled: boolean;

  @Column({ name: 'is_pedestrian_zone', type: 'boolean', default: false })
  isPedestrianZone: boolean;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @Column({ name: 'is_compliant', type: 'boolean', default: true })
  isCompliant: boolean;

  @Column({ name: 'penalty_paise', type: 'int', default: 0 })
  penaltyPaise: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
