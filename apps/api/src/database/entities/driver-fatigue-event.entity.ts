import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('driver_fatigue_events')
export class DriverFatigueEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'perclos_percent', type: 'numeric', precision: 5, scale: 2 })
  perclosPercent: number;

  @Column({ name: 'yawn_count', type: 'int', default: 0 })
  yawnCount: number;

  @Column({ name: 'micro_sleep_detected', type: 'boolean', default: false })
  microSleepDetected: boolean;

  @Column({ name: 'composite_fatigue_score', type: 'int' })
  compositeFatigueScore: number;

  @Column({ type: 'varchar', length: 32 })
  severity: string;

  @Column({ name: 'haptic_alert_triggered', type: 'boolean', default: false })
  hapticAlertTriggered: boolean;

  @Column({ name: 'mandatory_rest_required', type: 'boolean', default: false })
  mandatoryRestRequired: boolean;

  @Column({ name: 'rest_duration_minutes', type: 'int', default: 0 })
  restDurationMinutes: number;

  @Column({ name: 'dispatch_blocked_until', type: 'timestamptz', nullable: true })
  dispatchBlockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
