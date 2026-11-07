import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { FloodEvacuationRiskSeverity } from '@ecoride/contracts';

@Entity('flood_evacuation_alerts')
@Index('idx_flood_alert_zone_severity', ['zone', 'severity'])
export class FloodEvacuationAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sensor_location', type: 'varchar', length: 128 })
  sensorLocation: string;

  @Column({ name: 'canal_or_water_body', type: 'varchar', length: 128 })
  canalOrWaterBody: string;

  @Column({ name: 'zone', type: 'varchar', length: 64 })
  zone: string;

  @Column({ name: 'water_depth_mm', type: 'float' })
  waterDepthMm: number;

  @Column({ name: 'critical_threshold_mm', type: 'float', default: 200.0 })
  criticalThresholdMm: number;

  @Column({ name: 'flow_velocity_mps', type: 'float', default: 0.0 })
  flowVelocityMps: number;

  @Column({
    name: 'severity',
    type: 'enum',
    enum: FloodEvacuationRiskSeverity,
    default: FloodEvacuationRiskSeverity.NORMAL,
  })
  severity: FloodEvacuationRiskSeverity;

  @Column({ name: 'reroute_active_trips', type: 'boolean', default: false })
  rerouteActiveTrips: boolean;

  @Column({ name: 'evacuation_hub_name', type: 'varchar', length: 128, nullable: true })
  evacuationHubName?: string;

  @Column({ name: 'evacuation_hub_lat', type: 'float', nullable: true })
  evacuationHubLat?: number;

  @Column({ name: 'evacuation_hub_lng', type: 'float', nullable: true })
  evacuationHubLng?: number;

  @Column({ name: 'active_vehicles_notified_count', type: 'int', default: 0 })
  activeVehiclesNotifiedCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
