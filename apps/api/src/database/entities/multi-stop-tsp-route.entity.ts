import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('multi_stop_tsp_routes')
export class MultiStopTspRouteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'route_id', type: 'varchar', length: 120, unique: true })
  routeId: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'ordered_stop_ids', type: 'text' })
  orderedStopIds: string; // JSON string array of stop IDs

  @Column({ name: 'total_distance_km', type: 'numeric', precision: 8, scale: 2 })
  totalDistanceKm: number;

  @Column({ name: 'estimated_energy_kwh', type: 'numeric', precision: 6, scale: 2 })
  estimatedEnergyKwh: number;

  @Column({ name: 'elevation_avoided_gain_meters', type: 'numeric', precision: 6, scale: 2, default: 0 })
  elevationAvoidedGainMeters: number;

  @CreateDateColumn({ name: 'optimized_at', type: 'timestamptz' })
  optimizedAt: Date;
}
