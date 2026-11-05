import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('battery_swap_stations')
export class BatterySwapStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_code', type: 'varchar', length: 50, unique: true })
  stationCode: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'address', type: 'text' })
  address: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ name: 'operator', type: 'varchar', length: 100 })
  operator: string;

  @Column({ name: 'total_bays', type: 'int', default: 12 })
  totalBays: number;

  @Column({ name: 'available_charged_packs', type: 'int', default: 8 })
  availableChargedPacks: number;

  @Column({ name: 'charging_packs', type: 'int', default: 4 })
  chargingPacks: number;

  @Column({ name: 'supported_models', type: 'jsonb' })
  supportedModels: string[];

  @Column({ name: 'swap_fee_paise', type: 'int', default: 10000 })
  swapFeePaise: number; // e.g. 10000 = ₹100.00

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'OPERATIONAL' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

