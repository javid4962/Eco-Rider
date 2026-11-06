import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('captain_mentorship_pairings')
export class CaptainMentorshipPairing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'mentor_captain_id', type: 'varchar', length: 64 })
  mentorCaptainId: string;

  @Column({ name: 'mentor_tier', type: 'varchar', length: 32 })
  mentorTier: string;

  @Index()
  @Column({ name: 'mentee_captain_id', type: 'varchar', length: 64 })
  menteeCaptainId: string;

  @Column({ type: 'varchar', length: 32, default: 'ASSIGNED' })
  status: string;

  @Column({ name: 'target_trips', type: 'int', default: 100 })
  targetTrips: number;

  @Column({ name: 'completed_trips', type: 'int', default: 0 })
  completedTrips: number;

  @Column({ name: 'minimum_rating', type: 'numeric', precision: 3, scale: 2, default: 4.85 })
  minimumRating: number;

  @Column({ name: 'current_rating', type: 'numeric', precision: 3, scale: 2, default: 5.0 })
  currentRating: number;

  @Column({ name: 'bonus_amount_paise', type: 'int', default: 250000 })
  bonusAmountPaise: number;

  @Column({ name: 'disbursed_at', type: 'timestamptz', nullable: true })
  disbursedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

