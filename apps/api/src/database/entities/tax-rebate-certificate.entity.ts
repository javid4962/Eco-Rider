import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('tax_rebate_certificates')
export class TaxRebateCertificateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'certificate_number', type: 'varchar', length: 64, unique: true })
  certificateNumber: string;

  @Index()
  @Column({ name: 'taxpayer_pan', type: 'varchar', length: 32 })
  taxpayerPan: string;

  @Column({ name: 'applicant_type', type: 'varchar', length: 64 })
  applicantType: string;

  @Column({ name: 'vehicle_vin', type: 'varchar', length: 64 })
  vehicleVin: string;

  @Column({ name: 'financial_year', type: 'varchar', length: 16 })
  financialYear: string;

  @Column({ name: 'eligible_deduction_paise', type: 'bigint' })
  eligibleDeductionPaise: number;

  @Column({ name: 'qr_verification_url', type: 'varchar', length: 256 })
  qrVerificationUrl: string;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;
}

