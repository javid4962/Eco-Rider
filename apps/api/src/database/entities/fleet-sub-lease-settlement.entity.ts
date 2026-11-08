import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('fleet_sub_lease_settlements')
@Index('idx_sublease_contract_vehicle', ['contractId', 'vehicleId'])
export class FleetSubLeaseSettlementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'varchar', length: 64 })
  contractId!: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId!: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId!: string;

  @Column({ name: 'fleet_owner_id', type: 'varchar', length: 64 })
  fleetOwnerId!: string;

  @Column({ name: 'battery_asset_co_id', type: 'varchar', length: 64 })
  batteryAssetCoId!: string;

  @Column({ name: 'gross_fare_paise', type: 'bigint' })
  grossFarePaise!: number;

  @Column({ name: 'platform_fee_paise', type: 'bigint' })
  platformFeePaise!: number;

  @Column({ name: 'net_distributable_paise', type: 'bigint' })
  netDistributablePaise!: number;

  @Column({ name: 'captain_share_paise', type: 'bigint' })
  captainSharePaise!: number;

  @Column({ name: 'fleet_owner_share_paise', type: 'bigint' })
  fleetOwnerSharePaise!: number;

  @Column({ name: 'battery_asset_co_share_paise', type: 'bigint' })
  batteryAssetCoSharePaise!: number;

  @Column({ name: 'is_balanced', type: 'boolean', default: true })
  isBalanced!: boolean;

  @CreateDateColumn({ name: 'settled_at', type: 'timestamptz' })
  settledAt!: Date;
}

