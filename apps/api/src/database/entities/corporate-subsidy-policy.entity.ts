import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('corporate_subsidy_policies')
export class CorporateSubsidyPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'corporate_account_id', type: 'uuid' })
  corporateAccountId: string;

  @Column({ name: 'company_name', type: 'varchar', length: 150 })
  companyName: string;

  @Column({ name: 'gstin', type: 'varchar', length: 20 })
  gstin: string;

  @Column({ name: 'subsidy_type', type: 'varchar', length: 50, default: 'PERCENTAGE_SPLIT' })
  subsidyType: string;

  @Column({ name: 'subsidy_percentage', type: 'decimal', precision: 5, scale: 2, default: 70.0 })
  subsidyPercentage: number;

  @Column({ name: 'max_per_trip_subsidy_paise', type: 'int', default: 20000 })
  maxPerTripSubsidyPaise: number; // ₹200.00 max cap

  @Column({ name: 'monthly_per_employee_cap_paise', type: 'int', default: 500000 })
  monthlyPerEmployeeCapPaise: number; // ₹5,000.00 monthly cap

  @Column({ name: 'allowed_zones', type: 'jsonb' })
  allowedZones: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

