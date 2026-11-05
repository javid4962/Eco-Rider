import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('captain_emi_plans')
export class CaptainEmiPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'lender_name', type: 'varchar', length: 150 })
  lenderName: string;

  @Column({ name: 'loan_account_number', type: 'varchar', length: 50, unique: true })
  loanAccountNumber: string;

  @Column({ name: 'total_principal_paise', type: 'int' })
  totalPrincipalPaise: number;

  @Column({ name: 'total_interest_paise', type: 'int' })
  totalInterestPaise: number;

  @Column({ name: 'daily_emi_installment_paise', type: 'int' })
  dailyEmiInstallmentPaise: number;

  @Column({ name: 'remaining_balance_paise', type: 'int' })
  remainingBalancePaise: number;

  @Column({ name: 'total_paid_paise', type: 'int', default: 0 })
  totalPaidPaise: number;

  @Column({ name: 'max_deduction_cap_percentage', type: 'decimal', precision: 5, scale: 2, default: 25.0 })
  maxDeductionCapPercentage: number; // Max 25% daily deduction guard

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

