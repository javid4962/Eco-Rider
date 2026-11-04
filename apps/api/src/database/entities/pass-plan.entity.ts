import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CommuterPassType } from '@ecoride/contracts';

@Entity('pass_plans')
export class PassPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_pass_plans_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: CommuterPassType.MONTHLY_UNLIMITED,
    name: 'pass_type',
  })
  passType!: CommuterPassType | string;

  @Column({ type: 'bigint', name: 'price_paise' })
  pricePaise!: number;

  @Column({ type: 'int', default: 30, name: 'validity_days' })
  validityDays!: number;

  @Column({ type: 'int', default: 60, name: 'ride_limit' })
  rideLimit!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

