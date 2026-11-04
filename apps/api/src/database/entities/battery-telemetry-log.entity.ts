import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('battery_telemetry_logs')
@Index('idx_battery_telem_vehicle', ['vehicleId', 'loggedAt'])
@Index('idx_battery_telem_captain', ['captainId'])
export class BatteryTelemetryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'uuid' })
  captainId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  socPercent!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  estimatedRangeKm!: number;

  @Column({ type: 'varchar', length: 50 })
  source!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  confidenceScore!: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  batteryTemperatureC!: number | null;

  @Column({ type: 'boolean', default: false })
  isLockoutTriggered!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  loggedAt!: Date;
}

