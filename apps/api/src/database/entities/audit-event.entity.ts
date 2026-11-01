import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export type AuditEventStatus = 'SUCCESS' | 'DENIED' | 'FAILED';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_audit_events_actor')
  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @Index('idx_audit_events_target_user')
  @Column({ type: 'uuid', nullable: true, name: 'target_user_id' })
  targetUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User;

  @Index('idx_audit_events_action')
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType!: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_id' })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_state' })
  previousState?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_state' })
  newState?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'correlation_id' })
  correlationId?: string;

  @Index('idx_audit_events_status')
  @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
  status!: AuditEventStatus;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason?: string;

  @Index('idx_audit_events_created')
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
