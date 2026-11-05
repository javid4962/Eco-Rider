import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('fleet_depots')
@Index('idx_fleet_depots_code', ['code'], { unique: true })
@Index('idx_fleet_depots_city', ['city'])
export class FleetDepot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 50, default: 'Vijayawada' })
  city!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  latitude!: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  longitude!: number;

  @Column({ type: 'int', default: 50 })
  totalParkingBays!: number;

  @Column({ type: 'int', default: 50 })
  availableParkingBays!: number;

  @Column({ type: 'int', default: 20 })
  totalChargingGuns!: number;

  @Column({ type: 'int', default: 20 })
  availableChargingGuns!: number;

  @Column({ type: 'boolean', default: true })
  isGovernmentAuthorized!: boolean;

  @Column({ type: 'varchar', length: 50, default: '+91 866 242 8999' })
  securityContact!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

