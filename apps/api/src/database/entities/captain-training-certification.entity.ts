import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('captain_training_certifications')
export class CaptainTrainingCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId: string;

  @Column({ name: 'course_type', type: 'varchar', length: 64 })
  courseType: string;

  @Column({ name: 'exam_score_percent', type: 'numeric', precision: 5, scale: 2 })
  examScorePercent: number;

  @Column({ name: 'eco_driving_kwh_per_100km', type: 'numeric', precision: 5, scale: 2 })
  ecoDrivingKwhPer100Km: number;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ name: 'awarded_badge', type: 'varchar', length: 64 })
  awardedBadge: string;

  @Column({ name: 'commission_discount_bps', type: 'int', default: 0 })
  commissionDiscountBps: number;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil: Date;

  @Column({ name: 'verification_url', type: 'varchar', length: 255 })
  verificationUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
