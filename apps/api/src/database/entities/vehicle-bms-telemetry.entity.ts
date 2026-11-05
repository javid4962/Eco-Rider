import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('vehicle_bms_telemetry')
export class VehicleBmsTelemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'pack_voltage_volts', type: 'decimal', precision: 6, scale: 2 })
  packVoltageVolts: number;

  @Column({ name: 'pack_current_amperes', type: 'decimal', precision: 6, scale: 2 })
  packCurrentAmperes: number;

  @Column({ name: 'cell_voltage_delta_mv', type: 'decimal', precision: 6, scale: 2 })
  cellVoltageDeltaMv: number;

  @Column({ name: 'max_cell_temp_celsius', type: 'decimal', precision: 4, scale: 1 })
  maxCellTempCelsius: number;

  @Column({ name: 'min_cell_temp_celsius', type: 'decimal', precision: 4, scale: 1 })
  minCellTempCelsius: number;

  @Column({ name: 'inverter_temp_celsius', type: 'decimal', precision: 4, scale: 1 })
  inverterTempCelsius: number;

  @Column({ name: 'motor_rpm', type: 'int' })
  motorRpm: number;

  @Column({ name: 'energy_consumption_wh_per_km', type: 'decimal', precision: 6, scale: 1 })
  energyConsumptionWhPerKm: number;

  @Column({ name: 'state_of_charge_percent', type: 'decimal', precision: 5, scale: 2 })
  stateOfChargePercent: number;

  @Column({ name: 'state_of_health_percent', type: 'decimal', precision: 5, scale: 2 })
  stateOfHealthPercent: number;

  @Column({ name: 'bms_thermal_safety_level', type: 'varchar', length: 30, default: 'NORMAL' })
  bmsThermalSafetyLevel: string;

  @Column({ name: 'fault_codes', type: 'jsonb', default: () => "'[]'" })
  faultCodes: string[];

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

