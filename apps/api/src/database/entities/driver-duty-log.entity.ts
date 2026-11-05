import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('driver_duty_logs')
export class DriverDutyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'shift_start_time', type: 'timestamp with time zone' })
  shiftStartTime: Date;

  @Column({ name: 'last_trip_end_time', type: 'timestamp with time zone', nullable: true })
  lastTripEndTime: Date | null;

  @Column({ name: 'continuous_driving_minutes', type: 'int', default: 0 })
  continuousDrivingMinutes: number;

  @Column({ name: 'total_daily_driving_minutes', type: 'int', default: 0 })
  totalDailyDrivingMinutes: number;

  @Column({ name: 'consecutive_rest_minutes', type: 'int', default: 0 })
  consecutiveRestMinutes: number;

  @Column({ name: 'fatigue_risk_level', type: 'varchar', length: 30, default: 'NORMAL' })
  fatigueRiskLevel: string;

  @Column({ name: 'is_dispatch_blocked', type: 'boolean', default: false })
  isDispatchBlocked: boolean;

  @Column({ name: 'lockout_expires_at', type: 'timestamp with time zone', nullable: true })
  lockoutExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

