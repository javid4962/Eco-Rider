import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CargoVehicleTier, CargoShipmentStatus } from '@ecoride/contracts';
import { CargoStop } from './cargo-stop.entity';

@Entity('cargo_shipments')
@Index('idx_cargo_shipment_sender', ['senderId'])
@Index('idx_cargo_shipment_captain', ['assignedCaptainId'])
@Index('idx_cargo_shipment_status', ['status'])
export class CargoShipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  trackingNumber!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  @Column({ type: 'uuid', nullable: true })
  assignedCaptainId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedVehicleId!: string | null;

  @Column({
    type: 'enum',
    enum: CargoVehicleTier,
    default: CargoVehicleTier.E_CARGO_2W,
  })
  tier!: CargoVehicleTier;

  @Column({
    type: 'enum',
    enum: CargoShipmentStatus,
    default: CargoShipmentStatus.REQUESTED,
  })
  status!: CargoShipmentStatus;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  packageWeightKg!: number;

  @Column({ type: 'varchar', length: 255 })
  packageDescription!: string;

  @Column({ type: 'boolean', default: false })
  requiresHelper!: boolean;

  @Column({ type: 'bigint', default: 0 })
  baseFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  weightFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  distanceFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  stopsFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  helperFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  gstPaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  totalFarePaise!: string | number;

  @Column({ type: 'bigint', default: 0 })
  totalCodPaise!: string | number;

  @OneToMany(() => CargoStop, (stop) => stop.shipment, { cascade: true })
  stops!: CargoStop[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

