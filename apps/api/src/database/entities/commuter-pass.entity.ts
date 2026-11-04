import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CommuterPassStatus } from '@ecoride/contracts';

@Entity('commuter_passes')
export class CommuterPass {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_commuter_passes_number', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'pass_number' })
  passNumber!: string;

  @Index('idx_commuter_passes_rider')
  @Column({ type: 'uuid', name: 'rider_id' })
  riderId!: string;

  @Index('idx_commuter_passes_plan')
  @Column({ type: 'uuid', name: 'plan_id' })
  planId!: string;

  @Index('idx_commuter_passes_status')
  @Column({
    type: 'varchar',
    length: 50,
    default: CommuterPassStatus.ACTIVE,
    name: 'status',
  })
  status!: CommuterPassStatus | string;

  @Column({ type: 'timestamptz', name: 'valid_from' })
  validFrom!: Date;

  @Column({ type: 'timestamptz', name: 'valid_until' })
  validUntil!: Date;

  @Column({ type: 'int', default: 60, name: 'total_rides' })
  totalRides!: number;

  @Column({ type: 'int', default: 60, name: 'rides_remaining' })
  ridesRemaining!: number;

  @Column({ type: 'bigint', name: 'price_paise' })
  pricePaise!: number;

  @Index('idx_commuter_passes_idempotency', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'idempotency_key' })
  idempotencyKey!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

