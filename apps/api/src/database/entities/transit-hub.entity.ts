import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TransitHubType } from '@ecoride/contracts';

@Entity('transit_hubs')
@Index('idx_transit_hubs_type', ['hubType'])
@Index('idx_transit_hubs_city', ['city'])
export class TransitHub {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: TransitHubType,
    default: TransitHubType.APSRTC_BUS_STATION,
  })
  hubType!: TransitHubType;

  @Column({ type: 'varchar', length: 50, default: 'Vijayawada' })
  city!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  latitude!: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  longitude!: number;

  @Column({ type: 'varchar', length: 50, default: 'Bay-EV-1' })
  dedicatedEvPickupBay!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

