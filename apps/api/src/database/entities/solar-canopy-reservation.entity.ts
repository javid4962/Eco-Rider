import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CanopyChargingBayType, CanopyReservationStatus } from '@ecoride/contracts';

@Entity({ name: 'solar_canopy_reservations' })
export class SolarCanopyReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'depot_id', type: 'varchar', length: 120 })
  depotId: string;

  @Column({
    name: 'bay_type',
    type: 'enum',
    enum: CanopyChargingBayType,
  })
  bayType: CanopyChargingBayType;

  @Column({ name: 'bay_number', type: 'varchar', length: 32 })
  bayNumber: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 120 })
  captainId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'deposit_fee_paise', type: 'bigint', default: 5000 })
  depositFeePaise: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CanopyReservationStatus,
    default: CanopyReservationStatus.RESERVED,
  })
  status: CanopyReservationStatus;

  @Column({ name: 'slot_start_time', type: 'timestamptz' })
  slotStartTime: Date;

  @Column({ name: 'slot_end_time', type: 'timestamptz' })
  slotEndTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

