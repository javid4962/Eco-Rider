import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChargingReservationStatus, ChargingConnectorType } from '@ecoride/contracts';
import { ChargingStation } from './charging-station.entity';

@Entity('charging_reservations')
@Index('idx_charging_res_station', ['stationId'])
@Index('idx_charging_res_captain', ['captainId'])
@Index('idx_charging_res_status', ['status'])
export class ChargingReservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  stationId!: string;

  @ManyToOne(() => ChargingStation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stationId' })
  station!: ChargingStation;

  @Column({ type: 'uuid' })
  captainId!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({
    type: 'enum',
    enum: ChargingConnectorType,
    default: ChargingConnectorType.CCS2,
  })
  connectorType!: ChargingConnectorType;

  @Column({
    type: 'enum',
    enum: ChargingReservationStatus,
    default: ChargingReservationStatus.RESERVED,
  })
  status!: ChargingReservationStatus;

  @Column({ type: 'timestamptz' })
  reservedUntil!: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  kwhConsumed!: number;

  @Column({ type: 'bigint', default: 0 })
  energyFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  gstPaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  totalFarePaise!: string | number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

