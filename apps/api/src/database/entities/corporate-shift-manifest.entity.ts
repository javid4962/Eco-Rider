import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkShiftType, ShiftManifestEmployeeEntryDto } from '@ecoride/contracts';

@Entity('corporate_shift_manifests')
export class CorporateShiftManifest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corp_manifests_account')
  @Column({ type: 'uuid', name: 'corporate_account_id' })
  corporateAccountId!: string;

  @Index('idx_corp_manifests_date')
  @Column({ type: 'date', name: 'manifest_date' })
  manifestDate!: string; // 'YYYY-MM-DD'

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkShiftType.GENERAL_MORNING,
    name: 'shift_type',
  })
  shiftType!: WorkShiftType | string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_vehicle_id' })
  assignedVehicleId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_captain_id' })
  assignedCaptainId?: string | null;

  @Column({ type: 'jsonb', name: 'employees_data' })
  employeesData!: ShiftManifestEmployeeEntryDto[];

  @Column({
    type: 'varchar',
    length: 50,
    default: 'SCHEDULED',
    name: 'status',
  })
  status!: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

