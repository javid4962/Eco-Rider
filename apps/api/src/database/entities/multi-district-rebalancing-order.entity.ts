import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('multi_district_rebalancing_orders')
export class MultiDistrictRebalancingOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_number', type: 'varchar', length: 64, unique: true })
  orderNumber: string;

  @Column({ name: 'source_district', type: 'varchar', length: 64 })
  sourceDistrict: string;

  @Column({ name: 'target_district', type: 'varchar', length: 64 })
  targetDistrict: string;

  @Column({ name: 'target_zone_id', type: 'varchar', length: 120 })
  targetZoneId: string;

  @Column({ name: 'bounty_paise', type: 'bigint' })
  bountyPaise: number;

  @Column({ name: 'captain_id', type: 'varchar', length: 120, nullable: true })
  captainId: string | null;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120, nullable: true })
  vehicleId: string | null;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}

