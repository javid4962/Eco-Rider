import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string; // Role code: e.g. RIDER, CAPTAIN, SUPPORT, FINANCE, FLEET, OPERATOR, SUPER_ADMIN

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  scopes!: string[];

  @Column({ type: 'boolean', default: true, name: 'is_system' })
  isSystem!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
