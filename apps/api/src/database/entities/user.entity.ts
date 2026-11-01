import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type UserRole =
  | 'RIDER'
  | 'CAPTAIN'
  | 'DISPATCHER'
  | 'FLEET_OWNER'
  | 'FINANCE_ADMIN'
  | 'SAFETY_OFFICER'
  | 'INSTITUTION_REP';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_users_phone')
  @Column({ type: 'varchar', length: 20, unique: true })
  phone!: string;

  @Index('idx_users_role')
  @Column({ type: 'varchar', length: 30 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

