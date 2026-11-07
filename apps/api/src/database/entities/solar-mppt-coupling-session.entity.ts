import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MpptCouplingMode } from '@ecoride/contracts';

@Entity('solar_mppt_coupling_sessions')
@Index('idx_solar_mppt_station_time', ['depotId', 'sessionStartedAt'])
export class SolarMpptCouplingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'depot_id', type: 'varchar', length: 64 })
  depotId: string;

  @Column({ name: 'pv_array_id', type: 'varchar', length: 64 })
  pvArrayId: string;

  @Column({ name: 'charger_gun_id', type: 'varchar', length: 64 })
  chargerGunId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'solar_irradiance_w_per_m2', type: 'float' })
  solarIrradianceWPerM2: number;

  @Column({ name: 'mppt_dc_bus_voltage_volts', type: 'float' })
  mpptDcBusVoltageVolts: number;

  @Column({ name: 'solar_dc_current_amps', type: 'float' })
  solarDcCurrentAmps: number;

  @Column({ name: 'solar_power_kw', type: 'float' })
  solarPowerKw: number;

  @Column({ name: 'vehicle_demand_kw', type: 'float' })
  vehicleDemandKw: number;

  @Column({ name: 'grid_power_import_kw', type: 'float', default: 0.0 })
  gridPowerImportKw: number;

  @Column({ name: 'dc_conversion_efficiency_percent', type: 'float', default: 98.5 })
  dcConversionEfficiencyPercent: number;

  @Column({ name: 'avoided_ac_dc_loss_kwh', type: 'float', default: 0.0 })
  avoidedAcDcLossKwh: number;

  @Column({
    name: 'coupling_mode',
    type: 'enum',
    enum: MpptCouplingMode,
    default: MpptCouplingMode.DIRECT_SOLAR_DC,
  })
  couplingMode: MpptCouplingMode;

  @Column({ name: 'session_started_at', type: 'timestamp with time zone' })
  sessionStartedAt: Date;

  @Column({ name: 'session_ended_at', type: 'timestamp with time zone', nullable: true })
  sessionEndedAt?: Date;

  @Column({ name: 'total_solar_energy_delivered_kwh', type: 'float', default: 0.0 })
  totalSolarEnergyDeliveredKwh: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

