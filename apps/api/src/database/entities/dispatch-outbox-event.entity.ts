import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Check } from 'typeorm';
import { OutboxEventStatus } from '@ecoride/contracts';

@Entity('dispatch_outbox_events')
@Check('chk_dispatch_outbox_events_status', `"status" IN ('PENDING', 'PUBLISHED', 'FAILED')`)
@Index('idx_dispatch_outbox_events_aggregate', ['aggregateType', 'aggregateId'])
@Index('idx_dispatch_outbox_events_status_created', ['status', 'createdAt'])
export class DispatchOutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'aggregate_type' })
  aggregateType!: string;

  @Column({ type: 'uuid', name: 'aggregate_id' })
  aggregateId!: string;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  eventType!: string;

  @Column({ type: 'jsonb', name: 'payload' })
  payload!: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 30,
    default: OutboxEventStatus.PENDING,
  })
  status!: OutboxEventStatus | string;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount!: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt?: Date | null;
}
