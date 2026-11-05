import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_referrals')
@Index('idx_user_referrals_code', ['referralCode'])
@Index('idx_user_referrals_user', ['userId'])
@Index('idx_user_referrals_referred', ['referredUserId'])
export class UserReferral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string; // Referrer

  @Column({ type: 'varchar', length: 30 })
  referralCode!: string;

  @Column({ type: 'uuid', nullable: true })
  referredUserId!: string | null; // Referee

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status!: 'PENDING' | 'COMPLETED' | 'EXPIRED';

  @Column({ type: 'bigint', default: 0 })
  rewardPaidPaise!: string | number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

