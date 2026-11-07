import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('weather_governor_events')
export class WeatherGovernorEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'corridor_id', type: 'varchar', length: 64 })
  corridorId: string;

  @Column({ name: 'severity', type: 'varchar', length: 64 })
  severity: string;

  @Column({ name: 'precipitation_mm_per_hr', type: 'numeric', precision: 6, scale: 2 })
  precipitationMmPerHr: number;

  @Column({ name: 'visibility_meters', type: 'numeric', precision: 8, scale: 2 })
  visibilityMeters: number;

  @Column({ name: 'enforced_speed_limit_kmph', type: 'integer' })
  enforcedSpeedLimitKmph: number;

  @Column({ name: 'vehicles_notified_count', type: 'integer', default: 0 })
  vehiclesNotifiedCount: number;

  @CreateDateColumn({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom: Date;
}
