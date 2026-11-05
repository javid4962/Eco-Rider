import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('depot_bay_allocations')
@Index('idx_depot_allocations_depot', ['depotId'])
@Index('idx_depot_allocations_vehicle', ['vehicleId'])
@Index('idx_depot_allocations_status', ['status'])
export class DepotBayAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  depotId!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar', length: 20 })
  bayNumber!: string;

  @Column({ type: 'timestamptz' })
  allocatedFrom!: Date;

  @Column({ type: 'timestamptz' })
  allocatedUntil!: Date;

  @Column({ type: 'varchar', length: 50, default: 'OVERNIGHT_PARKING' })
  purpose!: 'OVERNIGHT_PARKING' | 'CHARGING' | 'MAINTENANCE_INSPECTION';

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'RELEASED' | 'EXPIRED';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

