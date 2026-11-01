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
import type { CaptainApplication } from './captain-application.entity';
import { CaptainApplicationStatus, RequirementStatus } from '@ecoride/contracts';

@Entity('captain_application_reviews')
export class CaptainApplicationReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_app_reviews_application_id')
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId!: string;

  @ManyToOne('CaptainApplication', (app: CaptainApplication) => app.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application?: CaptainApplication;

  @Index('idx_app_reviews_reviewer_id')
  @Column({ type: 'uuid', nullable: true, name: 'reviewer_id' })
  reviewerId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer?: User | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'previous_status',
    default: CaptainApplicationStatus.DRAFT,
  })
  previousStatus!: CaptainApplicationStatus | string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'new_status',
    default: CaptainApplicationStatus.SUBMITTED,
  })
  newStatus!: CaptainApplicationStatus | string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'driver_requirements_status',
    default: RequirementStatus.PENDING,
  })
  driverRequirementsStatus!: RequirementStatus | string;

  @Column({ type: 'text', nullable: true, name: 'driver_rejection_reason' })
  driverRejectionReason?: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'vehicle_requirements_status',
    default: RequirementStatus.PENDING,
  })
  vehicleRequirementsStatus!: RequirementStatus | string;

  @Column({ type: 'text', nullable: true, name: 'vehicle_rejection_reason' })
  vehicleRejectionReason?: string | null;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'reviewed_at' })
  reviewedAt!: Date;
}
