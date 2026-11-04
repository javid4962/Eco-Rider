import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CargoStopType } from '@ecoride/contracts';
import { CargoShipment } from './cargo-shipment.entity';

@Entity('cargo_stops')
@Index('idx_cargo_stop_shipment_seq', ['shipmentId', 'sequence'])
export class CargoStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  shipmentId!: string;

  @ManyToOne(() => CargoShipment, (shipment) => shipment.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipmentId' })
  shipment!: CargoShipment;

  @Column({ type: 'int' })
  sequence!: number;

  @Column({
    type: 'enum',
    enum: CargoStopType,
    default: CargoStopType.PICKUP,
  })
  stopType!: CargoStopType;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'varchar', length: 120 })
  contactName!: string;

  @Column({ type: 'varchar', length: 20 })
  contactPhone!: string;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ type: 'bigint', default: 0 })
  codPaise!: string | number;

  @Column({ type: 'varchar', length: 6, nullable: true })
  podOtp!: string | null;

  @Column({ type: 'boolean', default: false })
  isCompleted!: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  recipientName!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  signatureHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

