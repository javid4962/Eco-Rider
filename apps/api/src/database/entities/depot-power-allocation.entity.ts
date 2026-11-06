import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('depot_power_allocations')
export class DepotPowerAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'depot_id', type: 'uuid' })
  depotId: string;

  @Column({ name: 'max_transformer_capacity_kw', type: 'decimal', precision: 8, scale: 2 })
  maxTransformerCapacityKw: number;

  @Column({ name: 'total_allocated_kw', type: 'decimal', precision: 8, scale: 2 })
  totalAllocatedKw: number;

  @Column({ name: 'active_vehicles_count', type: 'int' })
  activeVehiclesCount: number;

  @Column({ name: 'load_shedding_active', type: 'boolean', default: false })
  loadSheddingActive: boolean;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}

