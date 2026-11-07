import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('depot_smart_charging_plans')
export class DepotSmartChargingPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'depot_id', type: 'varchar', length: 120 })
  depotId: string;

  @Column({ name: 'total_allocated_kw', type: 'numeric', precision: 8, scale: 2 })
  totalAllocatedKw: number;

  @Column({ name: 'available_capacity_kw', type: 'numeric', precision: 8, scale: 2 })
  availableCapacityKw: number;

  @Column({ name: 'unmet_demand_kw', type: 'numeric', precision: 8, scale: 2 })
  unmetDemandKw: number;

  @Column({ name: 'allocations_json', type: 'text' })
  allocationsJson: string;

  @CreateDateColumn({ name: 'calculated_at', type: 'timestamptz' })
  calculatedAt: Date;
}

