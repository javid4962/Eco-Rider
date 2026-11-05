import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CaptainTier } from '@ecoride/contracts';

@Entity('captain_tier_progress')
@Index('idx_captain_tier_captain', ['captainId'], { unique: true })
export class CaptainTierProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  captainId!: string;

  @Column({
    type: 'enum',
    enum: CaptainTier,
    default: CaptainTier.BRONZE,
  })
  tier!: CaptainTier;

  @Column({ type: 'int', default: 0 })
  weeklyCompletedTrips!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100.0 })
  acceptanceRatePercent!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.0 })
  cancellationRatePercent!: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5.0 })
  customerRating!: number;

  @Column({ type: 'int', default: 0 })
  commissionDiscountBps!: number; // Basis points (e.g. 200 = 2% discount)

  @Column({ type: 'bigint', default: 0 })
  perTripBonusPaise!: string | number; // e.g. 1000 = ₹10/trip

  @Column({ type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

