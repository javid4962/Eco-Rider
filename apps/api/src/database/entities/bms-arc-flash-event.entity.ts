import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ArcFlashHazardLevel } from '@ecoride/contracts';

@Entity('bms_arc_flash_events')
@Index('idx_bms_arc_flash_vehicle_pack', ['vehicleId', 'packSerial'])
export class BmsArcFlashEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId!: string;

  @Column({ name: 'pack_serial', type: 'varchar', length: 64 })
  packSerial!: string;

  @Column({ name: 'pack_voltage', type: 'double precision' })
  packVoltage!: number;

  @Column({ name: 'max_cell_differential_mv', type: 'double precision' })
  maxCellDifferentialMilliVolts!: number;

  @Column({ name: 'internal_resistance_mohms', type: 'double precision' })
  internalResistanceMilliOhms!: number;

  @Column({ name: 'temp_rate_of_rise_c_per_sec', type: 'double precision' })
  temperatureRateOfRiseCelsiusPerSec!: number;

  @Column({ name: 'hazard_level', type: 'varchar', length: 64 })
  hazardLevel!: ArcFlashHazardLevel;

  @Column({ name: 'contactor_isolation_commanded', type: 'boolean', default: false })
  contactorIsolationCommanded!: boolean;

  @Column({ name: 'aerosol_suppression_armed', type: 'boolean', default: false })
  aerosolSuppressionArmed!: boolean;

  @Column({ name: 'recommended_driver_advisory', type: 'varchar', length: 255 })
  recommendedDriverAdvisory!: string;

  @CreateDateColumn({ name: 'evaluated_at', type: 'timestamptz' })
  evaluatedAt!: Date;
}

