import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PromoDiscountType, PromoApplicableService } from '@ecoride/contracts';

@Entity('promo_codes')
@Index('idx_promo_codes_code', ['code'], { unique: true })
@Index('idx_promo_codes_active', ['isActive'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({
    type: 'enum',
    enum: PromoDiscountType,
    default: PromoDiscountType.FLAT_DISCOUNT,
  })
  discountType!: PromoDiscountType;

  @Column({ type: 'int' })
  discountValue!: number; // Flat paise (e.g. 5000) or percentage (e.g. 20)

  @Column({ type: 'bigint', default: 5000 })
  maxDiscountPaise!: string | number;

  @Column({ type: 'bigint', default: 5000 })
  minFarePaise!: string | number;

  @Column({
    type: 'enum',
    enum: PromoApplicableService,
    default: PromoApplicableService.ALL,
  })
  applicableService!: PromoApplicableService;

  @Column({ type: 'int', default: 1 })
  usageLimitPerUser!: number;

  @Column({ type: 'int', default: 1000 })
  totalUsageLimit!: number;

  @Column({ type: 'int', default: 0 })
  currentUsageCount!: number;

  @Column({ type: 'timestamptz' })
  validFrom!: Date;

  @Column({ type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

