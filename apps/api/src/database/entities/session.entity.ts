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

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_sessions_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_sessions_token_hash', { unique: true })
  @Column({ type: 'varchar', length: 128, unique: true, name: 'token_hash' })
  tokenHash!: string;

  @Index('idx_sessions_previous_token_hash')
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'previous_token_hash' })
  previousTokenHash?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device_id' })
  deviceId?: string;

  @Column({ type: 'varchar', length: 30, default: 'WEB' })
  platform!: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Index('idx_sessions_is_revoked')
  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'last_active_at' })
  lastActiveAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
