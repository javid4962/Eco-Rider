import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  AgriProduceType,
  AgriConsignmentStatus,
} from '@ecoride/contracts';

@Entity('agri_produce_consignments')
@Index('idx_agri_consignment_mandal_status', ['mandal', 'status'])
export class AgriProduceConsignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consignment_code', type: 'varchar', length: 64, unique: true })
  consignmentCode: string;

  @Column({ name: 'farmer_id', type: 'varchar', length: 64 })
  farmerId: string;

  @Column({ name: 'farmer_name', type: 'varchar', length: 128 })
  farmerName: string;

  @Column({ name: 'farmer_aadhaar_masked', type: 'varchar', length: 32 })
  farmerAadhaarMasked: string;

  @Column({ name: 'farmer_upi_id', type: 'varchar', length: 128 })
  farmerUpiId: string;

  @Column({ name: 'mandal', type: 'varchar', length: 64 })
  mandal: string;

  @Column({ name: 'district', type: 'varchar', length: 64 })
  district: string;

  @Column({
    name: 'produce_type',
    type: 'enum',
    enum: AgriProduceType,
  })
  produceType: AgriProduceType;

  @Column({ name: 'gross_weight_kg', type: 'float' })
  grossWeightKg: number;

  @Column({ name: 'tare_weight_kg', type: 'float' })
  tareWeightKg: number;

  @Column({ name: 'net_weight_kg', type: 'float' })
  netWeightKg: number;

  @Column({ name: 'rate_per_kg_paise', type: 'bigint' })
  ratePerKgPaise: string;

  @Column({ name: 'gross_produce_value_paise', type: 'bigint' })
  grossProduceValuePaise: string;

  @Column({ name: 'apmc_cess_rate_bps', type: 'int', default: 100 }) // 1% APMC cess = 100 bps
  apmcCessRateBps: number;

  @Column({ name: 'apmc_cess_amount_paise', type: 'bigint' })
  apmcCessAmountPaise: string;

  @Column({ name: 'logistics_fee_paise', type: 'bigint' })
  logisticsFeePaise: string;

  @Column({ name: 'net_farmer_payout_paise', type: 'bigint' })
  netFarmerPayoutPaise: string;

  @Column({ name: 'ev_cargo_vehicle_id', type: 'varchar', length: 64 })
  evCargoVehicleId: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId: string;

  @Column({ name: 'markfed_hub_id', type: 'varchar', length: 64 })
  markfedHubId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AgriConsignmentStatus,
    default: AgriConsignmentStatus.AGGREGATING,
  })
  status: AgriConsignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
