import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fleet_repositioning_orders')
export class FleetRepositioningOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'origin_zone_name', type: 'varchar', length: 150 })
  originZoneName: string;

  @Column({ name: 'destination_zone_name', type: 'varchar', length: 150 })
  destinationZoneName: string;

  @Column({ name: 'incentive_bonus_paise', type: 'int' })
  incentiveBonusPaise: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'OFFERED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

