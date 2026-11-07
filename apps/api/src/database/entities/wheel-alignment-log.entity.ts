import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AlignmentStatus } from '@ecoride/contracts';

@Entity('wheel_alignment_logs')
@Index('idx_wheel_alignment_vehicle_time', ['vehicleId', 'loggedAt'])
export class WheelAlignmentLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId: string;

  @Column({ name: 'rolling_window_km', type: 'float', default: 100.0 })
  rollingWindowKm: number;

  @Column({ name: 'steering_angle_mean_offset_deg', type: 'float' })
  steeringAngleMeanOffsetDeg: number;

  @Column({ name: 'lateral_drift_rate_mps2', type: 'float' })
  lateralDriftRateMps2: number;

  @Column({ name: 'yaw_rate_variance', type: 'float' })
  yawRateVariance: number;

  @Column({ name: 'tire_scrub_severity_index', type: 'float' })
  tireScrubSeverityIndex: number;

  @Column({ name: 'estimated_tire_life_reduction_percent', type: 'float' })
  estimatedTireLifeReductionPercent: number;

  @Column({
    name: 'alignment_status',
    type: 'enum',
    enum: AlignmentStatus,
    default: AlignmentStatus.PERFECT,
  })
  alignmentStatus: AlignmentStatus;

  @Column({ name: 'depot_maintenance_required', type: 'boolean', default: false })
  depotMaintenanceRequired: boolean;

  @Column({ name: 'maintenance_work_order_ref', type: 'varchar', length: 64, nullable: true })
  maintenanceWorkOrderRef?: string;

  @CreateDateColumn({ name: 'logged_at' })
  loggedAt: Date;
}
