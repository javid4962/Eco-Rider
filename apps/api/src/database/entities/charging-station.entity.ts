import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChargingStationStatus, ChargingConnectorType } from '@ecoride/contracts';

@Entity('charging_stations')
@Index('idx_charging_stations_city', ['city'])
@Index('idx_charging_stations_code', ['code'], { unique: true })
@Index('idx_charging_stations_status', ['status'])
export class ChargingStation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 60 })
  city!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'varchar', length: 120 })
  operator!: string;

  @Column({ type: 'int', default: 4 })
  totalGuns!: number;

  @Column({ type: 'int', default: 4 })
  availableGuns!: number;

  @Column({ type: 'simple-array' })
  supportedConnectors!: ChargingConnectorType[];

  @Column({ type: 'int', default: 60 })
  maxPowerKw!: number;

  @Column({ type: 'bigint', default: 1800 })
  tariffPerKwhPaise!: string | number;

  @Column({
    type: 'enum',
    enum: ChargingStationStatus,
    default: ChargingStationStatus.OPERATIONAL,
  })
  status!: ChargingStationStatus;

  @Column({ type: 'simple-array', default: '' })
  amenities!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

