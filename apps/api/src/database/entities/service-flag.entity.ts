import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('service_flags')
@Unique('uq_service_flags_city_category', ['city', 'serviceCategory'])
export class ServiceFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_service_flags_city')
  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Index('idx_service_flags_category')
  @Column({ type: 'varchar', length: 50, name: 'service_category' })
  serviceCategory!: string;

  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  isEnabled!: boolean;

  @Column({ type: 'varchar', length: 50, name: 'release_phase' })
  releasePhase!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'blocker_reason' })
  blockerReason?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
