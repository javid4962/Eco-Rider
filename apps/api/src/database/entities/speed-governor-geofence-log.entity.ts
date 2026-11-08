import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UrbanZoneType } from '@ecoride/contracts';

@Entity('speed_governor_geofence_logs')
@Index('idx_speed_gov_vehicle_zone', ['vehicleId', 'zoneType'])
export class SpeedGovernorGeofenceLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId!: string;

  @Column({ name: 'latitude', type: 'double precision' })
  latitude!: number;

  @Column({ name: 'longitude', type: 'double precision' })
  longitude!: number;

  @Column({ name: 'current_speed_kmph', type: 'double precision' })
  currentSpeedKmph!: number;

  @Column({ name: 'zone_type', type: 'varchar', length: 64 })
  zoneType!: UrbanZoneType;

  @Column({ name: 'mandated_speed_limit_kmph', type: 'double precision' })
  mandatedSpeedLimitKmph!: number;

  @Column({ name: 'is_violation', type: 'boolean', default: false })
  isViolation!: boolean;

  @Column({ name: 'throttle_limit_percent', type: 'double precision', default: 100.0 })
  throttleLimitPercent!: number;

  @Column({ name: 'haptic_warning_issued', type: 'boolean', default: false })
  hapticWarningIssued!: boolean;

  @CreateDateColumn({ name: 'logged_at', type: 'timestamptz' })
  loggedAt!: Date;
}
