import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transformer_station_loads')
export class TransformerStationLoad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_id', type: 'uuid' })
  stationId: string;

  @Column({ name: 'station_name', type: 'varchar', length: 150 })
  stationName: string;

  @Column({ name: 'grid_substation_name', type: 'varchar', length: 150 })
  gridSubstationName: string;

  @Column({ name: 'transformer_capacity_kva', type: 'int', default: 500 })
  transformerCapacityKva: number;

  @Column({ name: 'current_load_kw', type: 'decimal', precision: 6, scale: 2, default: 0 })
  currentLoadKw: number;

  @Column({ name: 'load_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  loadPercentage: number;

  @Column({ name: 'is_throttling_active', type: 'boolean', default: false })
  isThrottlingActive: boolean;

  @Column({ name: 'active_charging_vehicles_count', type: 'int', default: 0 })
  activeChargingVehiclesCount: number;

  @Column({ name: 'recommended_max_kw_per_gun', type: 'decimal', precision: 5, scale: 2, default: 60.0 })
  recommendedMaxKwPerGun: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

