import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AqiLevel } from '@ecoride/contracts';

@Entity({ name: 'aqi_monitoring_records' })
export class AqiMonitoringRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_code', type: 'varchar', length: 120 })
  stationCode: string;

  @Column({ name: 'sensor_location', type: 'varchar', length: 120 })
  sensorLocation: string;

  @Column({ name: 'aqi_value', type: 'int' })
  aqiValue: number;

  @Column({ name: 'pm25', type: 'numeric', precision: 6, scale: 2 })
  pm25: number;

  @Column({ name: 'pm10', type: 'numeric', precision: 6, scale: 2 })
  pm10: number;

  @Column({
    name: 'aqi_level',
    type: 'enum',
    enum: AqiLevel,
  })
  aqiLevel: AqiLevel;

  @Column({ name: 'subsidy_active', type: 'boolean', default: false })
  subsidyActive: boolean;

  @Column({ name: 'subsidy_discount_percent', type: 'int', default: 0 })
  subsidyDiscountPercent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

