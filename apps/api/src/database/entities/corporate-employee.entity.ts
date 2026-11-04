import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkShiftType } from '@ecoride/contracts';

@Entity('corporate_employees')
@Index('idx_corp_emp_account_code', ['corporateAccountId', 'employeeCode'], { unique: true })
export class CorporateEmployee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corp_emp_account')
  @Column({ type: 'uuid', name: 'corporate_account_id' })
  corporateAccountId!: string;

  @Column({ type: 'varchar', length: 50, name: 'employee_code' })
  employeeCode!: string;

  @Column({ type: 'varchar', length: 100, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  department?: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkShiftType.GENERAL_MORNING,
    name: 'work_shift',
  })
  workShift!: WorkShiftType | string;

  @Column({ type: 'varchar', length: 255, name: 'pickup_address' })
  pickupAddress!: string;

  @Column({ type: 'double precision', name: 'pickup_latitude' })
  pickupLatitude!: number;

  @Column({ type: 'double precision', name: 'pickup_longitude' })
  pickupLongitude!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

