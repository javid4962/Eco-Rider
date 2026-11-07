import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ocpi_roaming_sessions')
export class OcpiRoamingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'ocpi_session_id', type: 'varchar', length: 120, unique: true })
  ocpiSessionId: string;

  @Column({ name: 'partner_cpo_id', type: 'varchar', length: 64 })
  partnerCpoId: string;

  @Column({ name: 'partner_station_id', type: 'varchar', length: 120 })
  partnerStationId: string;

  @Index()
  @Column({ name: 'ecoride_vehicle_vin', type: 'varchar', length: 64 })
  ecorideVehicleVin: string;

  @Column({ name: 'total_kwh', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalKwh: number;

  @Column({ name: 'roaming_tariff_paise_per_kwh', type: 'bigint' })
  roamingTariffPaisePerKwh: number;

  @Column({ name: 'total_cost_paise', type: 'bigint', default: 0 })
  totalCostPaise: number;

  @Column({ name: 'clearinghouse_settlement_id', type: 'varchar', length: 120 })
  clearinghouseSettlementId: string;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}

