import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  CrashSeverity,
  HighVoltageContactorStatus,
} from '@ecoride/contracts';

@Entity('crash_impact_telemetry_events')
@Index('idx_crash_impact_vehicle_time', ['vehicleId', 'createdAt'])
export class CrashImpactTelemetryEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 64, nullable: true })
  tripId?: string;

  @Column({ name: 'deceleration_g_force', type: 'float' })
  decelerationGForce: number;

  @Column({ name: 'airbag_deployed', type: 'boolean', default: false })
  airbagDeployed: boolean;

  @Column({ name: 'pyro_fuse_blown', type: 'boolean', default: false })
  pyroFuseBlown: boolean;

  @Column({
    name: 'hv_contactor_status',
    type: 'enum',
    enum: HighVoltageContactorStatus,
    default: HighVoltageContactorStatus.ISOLATED_SAFE,
  })
  hvContactorStatus: HighVoltageContactorStatus;

  @Column({ name: 'pack_voltage_volts', type: 'float' })
  packVoltageVolts: number;

  @Column({ name: 'isolation_resistance_k_ohms', type: 'float' })
  isolationResistanceKOhms: number;

  @Column({ name: 'latitude', type: 'float' })
  latitude: number;

  @Column({ name: 'longitude', type: 'float' })
  longitude: number;

  @Column({ name: 'speed_kmh_at_impact', type: 'float' })
  speedKmhAtImpact: number;

  @Column({ name: 'passenger_count', type: 'int', default: 1 })
  passengerCount: number;

  @Column({
    name: 'severity',
    type: 'enum',
    enum: CrashSeverity,
    default: CrashSeverity.MODERATE,
  })
  severity: CrashSeverity;

  @Column({ name: 'emergency_112_notified', type: 'boolean', default: false })
  emergency112Notified: boolean;

  @Column({ name: 'emergency_dispatch_ref', type: 'varchar', length: 64, nullable: true })
  emergencyDispatchRef?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

