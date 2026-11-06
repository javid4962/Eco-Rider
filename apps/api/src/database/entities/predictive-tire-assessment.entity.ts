import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('predictive_tire_assessments')
export class PredictiveTireAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'odometer_km', type: 'int' })
  odometerKm: number;

  @Column({ name: 'front_tread_remaining_mm', type: 'numeric', precision: 4, scale: 2 })
  frontTreadRemainingMm: number;

  @Column({ name: 'rear_tread_remaining_mm', type: 'numeric', precision: 4, scale: 2 })
  rearTreadRemainingMm: number;

  @Column({ name: 'ambient_road_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  ambientRoadTempCelsius: number;

  @Column({ name: 'tire_wear_status', type: 'varchar', length: 32 })
  tireWearStatus: string;

  @Column({ name: 'estimated_remaining_useful_life_km', type: 'int' })
  estimatedRemainingUsefulLifeKm: number;

  @Column({ name: 'immediate_depot_service_required', type: 'boolean', default: false })
  immediateDepotServiceRequired: boolean;

  @Column({ name: 'work_order_ref', type: 'varchar', length: 64, nullable: true })
  workOrderRef: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
