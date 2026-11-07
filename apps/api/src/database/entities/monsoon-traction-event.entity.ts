import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MonsoonAdaptiveMode, RoadConditionState } from '@ecoride/contracts';

@Entity({ name: 'monsoon_traction_events' })
export class MonsoonTractionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  @Column({ name: 'surface_friction_mu', type: 'numeric', precision: 4, scale: 2 })
  surfaceFrictionMu: number;

  @Column({ name: 'wheel_slip_percent', type: 'numeric', precision: 5, scale: 2 })
  wheelSlipPercent: number;

  @Column({
    name: 'road_condition',
    type: 'enum',
    enum: RoadConditionState,
    default: RoadConditionState.DRY_HIGH_TRACTION,
  })
  roadCondition: RoadConditionState;

  @Column({
    name: 'adaptive_mode',
    type: 'enum',
    enum: MonsoonAdaptiveMode,
    default: MonsoonAdaptiveMode.NORMAL_DRIVE,
  })
  adaptiveMode: MonsoonAdaptiveMode;

  @Column({ name: 'max_torque_limit_percent', type: 'int', default: 100 })
  maxTorqueLimitPercent: number;

  @Column({ name: 'max_speed_limit_kmh', type: 'int', default: 80 })
  maxSpeedLimitKmh: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
