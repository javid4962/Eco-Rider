import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fleet_maintenance_orders')
export class FleetMaintenanceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'service_type', type: 'varchar', length: 50 })
  serviceType: string;

  @Column({ name: 'depot_id', type: 'uuid' })
  depotId: string;

  @Column({ name: 'current_odometer_km', type: 'int' })
  currentOdometerKm: number;

  @Column({ name: 'trigger_reason', type: 'varchar', length: 255 })
  triggerReason: string;

  @Column({ name: 'estimated_cost_paise', type: 'int' })
  estimatedCostPaise: number;

  @Column({ name: 'actual_cost_paise', type: 'int', nullable: true })
  actualCostPaise: number | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'SCHEDULED' })
  status: string;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: string;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

