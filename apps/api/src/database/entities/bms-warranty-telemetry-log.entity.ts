import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('bms_warranty_telemetry_logs')
export class BmsWarrantyTelemetryLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'battery_serial', type: 'varchar', length: 120 })
  batterySerial: string;

  @Column({ name: 'max_cell_temperature_celsius', type: 'numeric', precision: 5, scale: 2 })
  maxCellTemperatureCelsius: number;

  @Column({ name: 'action_taken', type: 'varchar', length: 64 })
  actionTaken: string;

  @Column({ name: 'allowed_power_kw', type: 'numeric', precision: 6, scale: 2 })
  allowedPowerKw: number;

  @Column({ name: 'depot_cooling_bay_assigned', type: 'varchar', length: 120, nullable: true })
  depotCoolingBayAssigned: string | null;

  @Column({ name: 'warranty_protection_active', type: 'boolean', default: false })
  warrantyProtectionActive: boolean;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;
}

