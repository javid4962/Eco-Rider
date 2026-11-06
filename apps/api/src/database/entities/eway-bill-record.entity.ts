import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('eway_bill_records')
export class EwayBillRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'eway_bill_number', type: 'varchar', length: 32 })
  ewayBillNumber: string;

  @Index()
  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 32 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'consignor_gstin', type: 'varchar', length: 32 })
  consignorGstin: string;

  @Column({ name: 'consignee_gstin', type: 'varchar', length: 32 })
  consigneeGstin: string;

  @Column({ name: 'gross_weight_kg', type: 'numeric', precision: 8, scale: 2 })
  grossWeightKg: number;

  @Column({ name: 'vehicle_max_gvw_kg', type: 'numeric', precision: 8, scale: 2 })
  vehicleMaxGvwKg: number;

  @Column({ name: 'checkpost_name', type: 'varchar', length: 128 })
  checkpostName: string;

  @Column({ name: 'declared_goods_value_paise', type: 'bigint' })
  declaredGoodsValuePaise: string;

  @Column({ type: 'varchar', length: 32, default: 'VALID' })
  status: string;

  @Column({ name: 'clearance_reference', type: 'varchar', length: 64 })
  clearanceReference: string;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
