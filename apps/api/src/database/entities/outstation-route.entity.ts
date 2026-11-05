import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('outstation_routes')
export class OutstationRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_code', type: 'varchar', length: 50, unique: true })
  routeCode: string;

  @Column({ name: 'origin_city', type: 'varchar', length: 50 })
  originCity: string;

  @Column({ name: 'destination_city', type: 'varchar', length: 50 })
  destinationCity: string;

  @Column({ name: 'distance_km', type: 'decimal', precision: 6, scale: 2 })
  distanceKm: number;

  @Column({ name: 'estimated_transit_minutes', type: 'int' })
  estimatedTransitMinutes: number;

  @Column({ name: 'base_fare_paise', type: 'int' })
  baseFarePaise: number;

  @Column({ name: 'toll_estimate_paise', type: 'int', default: 0 })
  tollEstimatePaise: number;

  @Column({ name: 'required_min_soc_percent', type: 'decimal', precision: 5, scale: 2, default: 60.0 })
  requiredMinSocPercent: number;

  @Column({ name: 'mandatory_charging_stop_name', type: 'varchar', length: 150, nullable: true })
  mandatoryChargingStopName: string | null;

  @Column({ name: 'mandatory_charging_stop_km', type: 'decimal', precision: 6, scale: 2, nullable: true })
  mandatoryChargingStopKm: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

