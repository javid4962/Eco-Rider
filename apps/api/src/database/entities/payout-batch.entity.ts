import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PayoutBatchStatus } from '@ecoride/contracts';

@Entity('payout_batches')
export class PayoutBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_payout_batches_number', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'batch_number' })
  batchNumber!: string;

  @Index('idx_payout_batches_status')
  @Column({
    type: 'varchar',
    length: 50,
    default: PayoutBatchStatus.PROPOSED,
    name: 'status',
  })
  status!: PayoutBatchStatus | string;

  @Column({ type: 'bigint', default: 0, name: 'total_disbursal_paise' })
  totalDisbursalPaise!: number;

  @Column({ type: 'int', default: 0, name: 'total_items_count' })
  totalItemsCount!: number;

  @Column({ type: 'timestamptz', name: 'period_start' })
  periodStart!: Date;

  @Column({ type: 'timestamptz', name: 'period_end' })
  periodEnd!: Date;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by_id' })
  approvedById?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

