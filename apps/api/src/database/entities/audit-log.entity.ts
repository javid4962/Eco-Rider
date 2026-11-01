import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_audit_logs_entity')
  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType!: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_state' })
  previousState?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_state' })
  newState?: Record<string, unknown>;

  @Index('idx_audit_logs_created')
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}

