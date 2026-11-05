import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('smart_charging_profiles')
export class SmartChargingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_id', type: 'uuid' })
  stationId: string;

  @Column({ name: 'connector_id', type: 'int', default: 1 })
  connectorId: number;

  @Column({ name: 'stack_level', type: 'int', default: 1 })
  stackLevel: number;

  @Column({ name: 'charging_profile_purpose', type: 'varchar', length: 50, default: 'TX_DEFAULT_PROFILE' })
  chargingProfilePurpose: string;

  @Column({ name: 'charging_rate_unit', type: 'varchar', length: 10, default: 'W' })
  chargingRateUnit: string;

  @Column({ name: 'max_power_kw', type: 'decimal', precision: 5, scale: 2 })
  maxPowerKw: number;

  @Column({ name: 'start_period_seconds', type: 'int', default: 0 })
  startPeriodSeconds: number;

  @Column({ name: 'valid_from', type: 'timestamp with time zone' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamp with time zone' })
  validTo: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

