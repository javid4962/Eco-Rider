import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('freight_manifest_hash_records')
export class FreightManifestHashRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'manifest_id', type: 'varchar', length: 120, unique: true })
  manifestId: string;

  @Column({ name: 'consignor_gstin', type: 'varchar', length: 32 })
  consignorGstin: string;

  @Column({ name: 'consignee_gstin', type: 'varchar', length: 32 })
  consigneeGstin: string;

  @Column({ name: 'origin_hub', type: 'varchar', length: 120 })
  originHub: string;

  @Column({ name: 'destination_hub', type: 'varchar', length: 120 })
  destinationHub: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'total_weight_kg', type: 'numeric', precision: 10, scale: 2 })
  totalWeightKg: number;

  @Column({ name: 'item_count', type: 'integer' })
  itemCount: number;

  @Column({ name: 'battery_soc_start_pct', type: 'numeric', precision: 5, scale: 2 })
  batterySoCStartPct: number;

  @Column({ name: 'merkle_root_hash', type: 'varchar', length: 128 })
  merkleRootHash: string;

  @Column({ name: 'cryptographic_signature', type: 'varchar', length: 256 })
  cryptographicSignature: string;

  @CreateDateColumn({ name: 'anchored_at', type: 'timestamptz' })
  anchoredAt: Date;
}
