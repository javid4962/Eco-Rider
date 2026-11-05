import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('incentive_challenges')
@Index('idx_challenges_active', ['isActive'])
export class IncentiveChallenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int', default: 10 })
  targetTrips!: number;

  @Column({ type: 'bigint', default: 50000 })
  rewardPaise!: string | number; // e.g. 50000 = ₹500.00

  @Column({ type: 'varchar', length: 50, default: 'DAILY_ALL' })
  applicableShift!: string;

  @Column({ type: 'varchar', length: 50, default: 'Vijayawada' })
  city!: string;

  @Column({ type: 'timestamptz' })
  startDate!: Date;

  @Column({ type: 'timestamptz' })
  endDate!: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

