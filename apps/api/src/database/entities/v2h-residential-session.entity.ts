import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { V2hDischargeStatus } from '@ecoride/contracts';

@Entity({ name: 'v2h_residential_sessions' })
export class V2hResidentialSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'household_account_id', type: 'varchar', length: 120 })
  householdAccountId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'contracted_kwh', type: 'numeric', precision: 5, scale: 2 })
  contractedKwh: number;

  @Column({ name: 'energy_delivered_kwh', type: 'numeric', precision: 5, scale: 2, default: 0 })
  energyDeliveredKwh: number;

  @Column({ name: 'discharge_tariff_paise_per_kwh', type: 'bigint', default: 1400 })
  dischargeTariffPaisePerKwh: number;

  @Column({ name: 'total_earnings_paise', type: 'bigint', default: 0 })
  totalEarningsPaise: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: V2hDischargeStatus,
    default: V2hDischargeStatus.STANDBY_READY,
  })
  status: V2hDischargeStatus;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
