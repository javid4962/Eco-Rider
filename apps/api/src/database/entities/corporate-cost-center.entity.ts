import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CostCenterStatus } from '@ecoride/contracts';

@Entity({ name: 'corporate_cost_centers' })
export class CorporateCostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'corporate_account_id', type: 'varchar', length: 120 })
  corporateAccountId: string;

  @Column({ name: 'department_code', type: 'varchar', length: 64 })
  departmentCode: string;

  @Column({ name: 'department_name', type: 'varchar', length: 120 })
  departmentName: string;

  @Column({ name: 'monthly_budget_limit_paise', type: 'bigint' })
  monthlyBudgetLimitPaise: number;

  @Column({ name: 'current_spend_paise', type: 'bigint', default: 0 })
  currentSpendPaise: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CostCenterStatus,
    default: CostCenterStatus.ACTIVE,
  })
  status: CostCenterStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

