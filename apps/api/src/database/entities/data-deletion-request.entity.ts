import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export type DeletionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface StatutoryRetentionException {
  category: string;
  statutoryBasis: string;
  retentionPeriod: string;
  retentionPeriodYears: number;
  scope: string;
}

@Entity('data_deletion_requests')
export class DataDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_deletion_requests_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_deletion_requests_status')
  @Column({ type: 'varchar', length: 30 })
  status!: DeletionStatus;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb", name: 'erased_items' })
  erasedItems!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb", name: 'mandatory_retention_exceptions' })
  mandatoryRetentionExceptions!: StatutoryRetentionException[];

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
