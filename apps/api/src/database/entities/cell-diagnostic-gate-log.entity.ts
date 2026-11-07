import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CellDiagnosticHealth } from '@ecoride/contracts';

@Entity('cell_diagnostic_gate_logs')
@Index('idx_cell_diagnostic_pack_serial', ['batteryPackSerial', 'inspectedAt'])
export class CellDiagnosticGateLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'depot_id', type: 'varchar', length: 64 })
  depotId: string;

  @Column({ name: 'bay_number', type: 'varchar', length: 32 })
  bayNumber: string;

  @Column({ name: 'battery_pack_serial', type: 'varchar', length: 64 })
  batteryPackSerial: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64, nullable: true })
  vehicleId?: string;

  @Column({ name: 'measured_swelling_mm', type: 'float' })
  measuredSwellingMm: number;

  @Column({ name: 'max_allowable_swelling_mm', type: 'float', default: 3.5 })
  maxAllowableSwellingMm: number;

  @Column({ name: 'internal_gas_pressure_k_pa', type: 'float' })
  internalGasPressureKPa: number;

  @Column({ name: 'cell_surface_temperature_c', type: 'float' })
  cellSurfaceTemperatureC: number;

  @Column({
    name: 'diagnostic_health',
    type: 'enum',
    enum: CellDiagnosticHealth,
    default: CellDiagnosticHealth.NORMAL,
  })
  diagnosticHealth: CellDiagnosticHealth;

  @Column({ name: 'charging_allowed', type: 'boolean', default: true })
  chargingAllowed: boolean;

  @Column({ name: 'quarantine_triggered', type: 'boolean', default: false })
  quarantineTriggered: boolean;

  @Column({ name: 'fire_suppression_pre_armed', type: 'boolean', default: false })
  fireSuppressionPreArmed: boolean;

  @CreateDateColumn({ name: 'inspected_at' })
  inspectedAt: Date;
}
