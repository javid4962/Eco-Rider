import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CorporateAccountStatus } from '@ecoride/contracts';

@Entity('corporate_accounts')
export class CorporateAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, name: 'company_name' })
  companyName!: string;

  @Index('idx_corporate_accounts_cin', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'cin_or_registration' })
  cinOrRegistration!: string;

  @Index('idx_corporate_accounts_gstin', { unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  gstin!: string;

  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Column({ type: 'varchar', length: 100, name: 'contact_email' })
  contactEmail!: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_phone' })
  contactPhone!: string;

  @Column({ type: 'bigint', name: 'monthly_credit_limit_paise' })
  monthlyCreditLimitPaise!: number;

  @Column({ type: 'bigint', default: 0, name: 'current_outstanding_paise' })
  currentOutstandingPaise!: number;

  @Index('idx_corporate_accounts_status')
  @Column({
    type: 'varchar',
    length: 50,
    default: CorporateAccountStatus.ACTIVE,
    name: 'status',
  })
  status!: CorporateAccountStatus | string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

