import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FareCalculationBreakdown } from '@ecoride/contracts';
import { FareRule } from './fare-rule.entity';

@Entity('ride_quotes')
export class RideQuote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, name: 'rider_id' })
  riderId?: string | null;

  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Column({ type: 'varchar', length: 50, name: 'service_category' })
  serviceCategory!: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, name: 'pickup_latitude' })
  pickupLatitude!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, name: 'pickup_longitude' })
  pickupLongitude!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, name: 'dropoff_latitude' })
  dropoffLatitude!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, name: 'dropoff_longitude' })
  dropoffLongitude!: number;

  @Column({ type: 'int', name: 'distance_meters' })
  distanceMeters!: number;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'int', default: 0, name: 'waiting_minutes' })
  waitingMinutes!: number;

  @Index('idx_ride_quotes_fare_rule')
  @Column({ type: 'uuid', name: 'fare_rule_id' })
  fareRuleId!: string;

  @ManyToOne(() => FareRule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fare_rule_id' })
  fareRule?: FareRule;

  @Column({ type: 'int', name: 'fare_rule_version' })
  fareRuleVersion!: number;

  @Column({ type: 'jsonb', name: 'fare_breakdown' })
  fareBreakdown!: FareCalculationBreakdown;

  @Column({ type: 'int', name: 'total_fare_paise' })
  totalFarePaise!: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'applied_promo_code' })
  appliedPromoCode?: string | null;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 30, default: 'BATTERY_ELECTRIC' })
  propulsion!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
