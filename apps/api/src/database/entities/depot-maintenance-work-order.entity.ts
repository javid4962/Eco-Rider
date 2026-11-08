import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SparePartCategory, DepotWorkOrderStatus } from '@ecoride/contracts';

@Entity('depot_work_orders')
@Index('idx_depot_work_orders_depot_vehicle', ['depotId', 'vehicleId'])
export class DepotMaintenanceWorkOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'depot_id', type: 'varchar', length: 64 })
  depotId!: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId!: string;

  @Column({ name: 'part_category', type: 'varchar', length: 64 })
  partCategory!: SparePartCategory;

  @Column({ name: 'status', type: 'varchar', length: 32, default: DepotWorkOrderStatus.SCHEDULED })
  status!: DepotWorkOrderStatus;

  @Column({ name: 'odometer_km', type: 'double precision' })
  odometerKm!: number;

  @Column({ name: 'regen_cycles_count', type: 'integer' })
  regenCyclesCount!: number;

  @Column({ name: 'estimated_labor_minutes', type: 'integer', default: 60 })
  estimatedLaborMinutes!: number;

  @Column({ name: 'parts_reserved_units', type: 'integer', default: 1 })
  partsReservedUnits!: number;

  @Column({ name: 'preventive_alert_issued', type: 'boolean', default: true })
  preventiveAlertIssued!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
