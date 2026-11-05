import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('v2g_discharge_sessions')
export class V2gDischargeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 50, unique: true })
  sessionId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'depot_id', type: 'uuid' })
  depotId: string;

  @Column({ name: 'charger_gun_id', type: 'varchar', length: 50 })
  chargerGunId: string;

  @Column({ name: 'initial_soc_percent', type: 'int' })
  initialSocPercent: number;

  @Column({ name: 'current_soc_percent', type: 'int' })
  currentSocPercent: number;

  @Column({ name: 'min_soc_threshold_percent', type: 'int', default: 40 })
  minSocThresholdPercent: number;

  @Column({ name: 'energy_exported_kwh', type: 'decimal', precision: 8, scale: 2, default: 0 })
  energyExportedKwh: number;

  @Column({ name: 'feed_in_tariff_paise_per_kwh', type: 'int', default: 850 })
  feedInTariffPaisePerKwh: number;

  @Column({ name: 'total_revenue_earned_paise', type: 'int', default: 0 })
  totalRevenueEarnedPaise: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'SCHEDULED' })
  status: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;
}
