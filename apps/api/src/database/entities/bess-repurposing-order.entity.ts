import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bess_repurposing_orders')
export class BessRepurposingOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'battery_pack_serial', type: 'varchar', length: 100 })
  batteryPackSerial: string;

  @Column({ name: 'designated_depot_id', type: 'uuid' })
  designatedDepotId: string;

  @Column({ name: 'intended_use', type: 'varchar', length: 150 })
  intendedUse: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDING_INSPECTION' })
  status: string;

  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

