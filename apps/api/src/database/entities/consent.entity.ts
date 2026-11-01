import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('consents')
@Unique('uq_user_consent_type_version', ['userId', 'consentType', 'consentVersion'])
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_consents_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.consents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 50, name: 'consent_type' })
  consentType!: string;

  @Column({ type: 'varchar', length: 20, name: 'consent_version' })
  consentVersion!: string;

  @Column({ type: 'boolean', default: true, name: 'is_granted' })
  isGranted!: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'granted_at' })
  grantedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
