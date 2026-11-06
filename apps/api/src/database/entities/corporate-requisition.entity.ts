import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('corporate_requisitions')
export class CorporateRequisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'corporate_account_id', type: 'varchar', length: 64 })
  corporateAccountId: string;

  @Column({ name: 'department_code', type: 'varchar', length: 64 })
  departmentCode: string;

  @Index()
  @Column({ name: 'employee_user_id', type: 'varchar', length: 64 })
  employeeUserId: string;

  @Column({ name: 'manager_user_id', type: 'varchar', length: 64 })
  managerUserId: string;

  @Column({ name: 'trip_purpose', type: 'varchar', length: 255 })
  tripPurpose: string;

  @Column({ name: 'estimated_fare_paise', type: 'int' })
  estimatedFarePaise: number;

  @Column({ name: 'approved_fare_cap_paise', type: 'int' })
  approvedFareCapPaise: number;

  @Column({ type: 'varchar', length: 32, default: 'PENDING_MANAGER_APPROVAL' })
  status: string;

  @Column({ name: 'reviewed_by', type: 'varchar', length: 64, nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'decision_note', type: 'text', nullable: true })
  decisionNote: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

