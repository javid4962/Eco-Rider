import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cold_chain_shipments')
export class ColdChainShipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consignment_id', type: 'varchar', length: 50, unique: true })
  consignmentId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'cargo_type', type: 'varchar', length: 100 })
  cargoType: string;

  @Column({ name: 'required_range', type: 'varchar', length: 30, default: 'CHILLED' })
  requiredRange: string;

  @Column({ name: 'min_allowed_temp_celsius', type: 'decimal', precision: 4, scale: 1, default: 2.0 })
  minAllowedTempCelsius: number;

  @Column({ name: 'max_allowed_temp_celsius', type: 'decimal', precision: 4, scale: 1, default: 8.0 })
  maxAllowedTempCelsius: number;

  @Column({ name: 'current_temp_celsius', type: 'decimal', precision: 4, scale: 1, default: 4.5 })
  currentTempCelsius: number;

  @Column({ name: 'current_humidity_percent', type: 'decimal', precision: 5, scale: 2, default: 65.0 })
  currentHumidityPercent: number;

  @Column({ name: 'is_excursion_detected', type: 'boolean', default: false })
  isExcursionDetected: boolean;

  @Column({ name: 'total_excursions_count', type: 'int', default: 0 })
  totalExcursionsCount: number;

  @Column({ name: 'last_telemetry_at', type: 'timestamp with time zone' })
  lastTelemetryAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

