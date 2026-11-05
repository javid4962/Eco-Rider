import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('digital_permit_records')
export class DigitalPermitRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'permit_number', type: 'varchar', length: 64 })
  permitNumber: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 32 })
  registrationNumber: string;

  @Column({ name: 'permit_type', type: 'varchar', length: 64 })
  permitType: string;

  @Column({ name: 'rto_office_code', type: 'varchar', length: 32 })
  rtoOfficeCode: string;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil: Date;

  @Column({ name: 'puc_exempt', type: 'boolean', default: true })
  pucExempt: boolean;

  @Column({ name: 'road_tax_exempt', type: 'boolean', default: true })
  roadTaxExempt: boolean;

  @Column({ type: 'varchar', length: 32, default: 'COMPLIANT' })
  status: string;

  @Column({ name: 'verification_hash', type: 'varchar', length: 128 })
  verificationHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
