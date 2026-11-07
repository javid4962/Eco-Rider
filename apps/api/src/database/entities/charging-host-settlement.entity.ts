import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ChargingHostSettlementStatus } from '@ecoride/contracts';

@Entity('charging_host_settlements')
@Index('idx_charging_host_landlord_status', ['landlordId', 'status'])
export class ChargingHostSettlementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_id', type: 'varchar', length: 64 })
  stationId: string;

  @Column({ name: 'landlord_id', type: 'varchar', length: 64 })
  landlordId: string;

  @Column({ name: 'landlord_upi_id', type: 'varchar', length: 128 })
  landlordUpiId: string;

  @Column({ name: 'property_location', type: 'varchar', length: 128 })
  propertyLocation: string;

  @Column({ name: 'billing_period_start', type: 'timestamp with time zone' })
  billingPeriodStart: Date;

  @Column({ name: 'billing_period_end', type: 'timestamp with time zone' })
  billingPeriodEnd: Date;

  @Column({ name: 'total_energy_kwh', type: 'float' })
  totalEnergyKwh: number;

  @Column({ name: 'gross_revenue_paise', type: 'bigint' })
  grossRevenuePaise: string;

  @Column({ name: 'electricity_cost_paise', type: 'bigint' })
  electricityCostPaise: string;

  @Column({ name: 'gross_margin_paise', type: 'bigint' })
  grossMarginPaise: string;

  @Column({ name: 'landlord_share_bps', type: 'int' })
  landlordShareBps: number;

  @Column({ name: 'landlord_gross_payout_paise', type: 'bigint' })
  landlordGrossPayoutPaise: string;

  @Column({ name: 'gst_amount_paise', type: 'bigint' })
  gstAmountPaise: string;

  @Column({ name: 'tds_deduction_paise', type: 'bigint' })
  tdsDeductionPaise: string;

  @Column({ name: 'net_landlord_disbursal_paise', type: 'bigint' })
  netLandlordDisbursalPaise: string;

  @Column({ name: 'platform_share_paise', type: 'bigint' })
  platformSharePaise: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ChargingHostSettlementStatus,
    default: ChargingHostSettlementStatus.PENDING,
  })
  status: ChargingHostSettlementStatus;

  @Column({ name: 'disbursed_at', type: 'timestamp with time zone', nullable: true })
  disbursedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

