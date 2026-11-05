import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('battery_swap_transactions')
export class BatterySwapTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_id', type: 'uuid' })
  stationId: string;

  @Column({ name: 'station_code', type: 'varchar', length: 50 })
  stationCode: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'deposited_pack_serial', type: 'varchar', length: 100 })
  depositedPackSerial: string;

  @Column({ name: 'deposited_soc_percent', type: 'decimal', precision: 5, scale: 2 })
  depositedSocPercent: number;

  @Column({ name: 'dispensed_pack_serial', type: 'varchar', length: 100 })
  dispensedPackSerial: string;

  @Column({ name: 'dispensed_soc_percent', type: 'decimal', precision: 5, scale: 2 })
  dispensedSocPercent: number;

  @Column({ name: 'energy_replenished_kwh', type: 'decimal', precision: 5, scale: 2 })
  energyReplenishedKwh: number;

  @Column({ name: 'base_swap_fee_paise', type: 'int' })
  baseSwapFeePaise: number;

  @Column({ name: 'tax_paise', type: 'int' })
  taxPaise: number;

  @Column({ name: 'total_amount_paise', type: 'int' })
  totalAmountPaise: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, unique: true, nullable: true })
  idempotencyKey: string | null;

  @CreateDateColumn({ name: 'swapped_at' })
  swappedAt: Date;
}

