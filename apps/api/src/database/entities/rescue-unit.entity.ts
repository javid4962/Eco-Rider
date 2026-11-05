import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rescue_units')
export class RescueUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_code', type: 'varchar', length: 50, unique: true })
  unitCode: string;

  @Column({ name: 'operator_name', type: 'varchar', length: 150 })
  operatorName: string;

  @Column({ name: 'mobile_charger_capacity_kw', type: 'decimal', precision: 5, scale: 2, default: 30.0 })
  mobileChargerCapacityKw: number;

  @Column({ name: 'current_battery_soc_percent', type: 'decimal', precision: 5, scale: 2, default: 90.0 })
  currentBatterySocPercent: number;

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 6 })
  currentLatitude: number;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 10, scale: 6 })
  currentLongitude: number;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ name: 'service_radius_km', type: 'decimal', precision: 5, scale: 2, default: 25.0 })
  serviceRadiusKm: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

