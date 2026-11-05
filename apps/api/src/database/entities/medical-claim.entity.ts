import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medical_claims')
export class MedicalClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'claim_number', type: 'varchar', length: 50, unique: true })
  claimNumber: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'hospital_name', type: 'varchar', length: 150 })
  hospitalName: string;

  @Column({ name: 'treatment_type', type: 'varchar', length: 150 })
  treatmentType: string;

  @Column({ name: 'claim_amount_paise', type: 'int' })
  claimAmountPaise: number;

  @Column({ name: 'approved_amount_paise', type: 'int', default: 0 })
  approvedAmountPaise: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'SUBMITTED' })
  status: string;

  @Column({ name: 'discharge_summary_url', type: 'varchar', length: 255 })
  dischargeSummaryUrl: string;

  @Column({ name: 'disbursed_utr', type: 'varchar', length: 100, nullable: true })
  disbursedUtr: string | null;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

