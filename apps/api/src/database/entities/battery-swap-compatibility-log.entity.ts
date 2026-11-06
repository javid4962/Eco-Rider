import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('battery_swap_compatibility_logs')
export class BatterySwapCompatibilityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'pack_serial_number', type: 'varchar', length: 64 })
  packSerialNumber: string;

  @Column({ name: 'vendor_standard', type: 'varchar', length: 64 })
  vendorStandard: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64, nullable: true })
  vehicleId: string | null;

  @Column({ name: 'max_cell_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  maxCellTempCelsius: number;

  @Column({ name: 'min_cell_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  minCellTempCelsius: number;

  @Column({ name: 'cell_voltage_max_volts', type: 'numeric', precision: 5, scale: 3 })
  cellVoltageMaxVolts: number;

  @Column({ name: 'cell_voltage_min_volts', type: 'numeric', precision: 5, scale: 3 })
  cellVoltageMinVolts: number;

  @Column({ name: 'insulation_resistance_megaohms', type: 'numeric', precision: 6, scale: 2 })
  insulationResistanceMegaOhms: number;

  @Column({ name: 'soc_percent', type: 'numeric', precision: 5, scale: 2 })
  socPercent: number;

  @Column({ name: 'soh_percent', type: 'numeric', precision: 5, scale: 2 })
  sohPercent: number;

  @Column({ type: 'varchar', length: 64 })
  verdict: string;

  @Column({ name: 'is_eligible_for_swap', type: 'boolean', default: false })
  isEligibleForSwap: boolean;

  @Column({ name: 'safety_interlock_engaged', type: 'boolean', default: false })
  safetyInterlockEngaged: boolean;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

