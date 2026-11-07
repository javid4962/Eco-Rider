import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('pantograph_charging_sessions')
export class PantographChargingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'session_number', type: 'varchar', length: 64, unique: true })
  sessionNumber: string;

  @Index()
  @Column({ name: 'bus_id', type: 'varchar', length: 120 })
  busId: string;

  @Column({ name: 'station_id', type: 'varchar', length: 120 })
  stationId: string;

  @Column({ name: 'charger_bay_number', type: 'integer' })
  chargerBayNumber: number;

  @Column({ name: 'contact_pressure_newtons', type: 'numeric', precision: 6, scale: 2 })
  contactPressureNewtons: number;

  @Column({ name: 'alignment_status', type: 'varchar', length: 64 })
  alignmentStatus: string;

  @Column({ name: 'initial_soc_pct', type: 'numeric', precision: 5, scale: 2 })
  initialSocPct: number;

  @Column({ name: 'final_soc_pct', type: 'numeric', precision: 5, scale: 2 })
  finalSocPct: number;

  @Column({ name: 'energy_delivered_kwh', type: 'numeric', precision: 8, scale: 2, default: 0 })
  energyDeliveredKwh: number;

  @Column({ name: 'peak_power_kw', type: 'numeric', precision: 6, scale: 2 })
  peakPowerKw: number;

  @Column({ name: 'tariff_paise_per_kwh', type: 'bigint' })
  tariffPaisePerKwh: number;

  @Column({ name: 'total_cost_paise', type: 'bigint', default: 0 })
  totalCostPaise: number;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
