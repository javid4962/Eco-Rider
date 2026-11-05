import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('grid_tariff_windows')
export class GridTariffWindow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone', type: 'varchar', length: 50 })
  zone: string; // 'SOLAR_PEAK', 'NORMAL', 'EVENING_PEAK'

  @Column({ name: 'start_hour_ist', type: 'int' })
  startHourIst: number;

  @Column({ name: 'end_hour_ist', type: 'int' })
  endHourIst: number;

  @Column({ name: 'rate_per_kwh_paise', type: 'int' })
  ratePerKwhPaise: number; // e.g. 650 = ₹6.50/kWh

  @Column({ name: 'discom_name', type: 'varchar', length: 100, default: 'APCPDCL / APSPDCL' })
  discomName: string;

  @Column({ name: 'is_green_energy_peak', type: 'boolean', default: false })
  isGreenEnergyPeak: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

