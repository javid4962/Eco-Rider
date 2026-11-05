import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('carbon_reward_redemptions')
export class CarbonRewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 50 })
  productId: string;

  @Column({ name: 'product_title', type: 'varchar', length: 150 })
  productTitle: string;

  @Column({ name: 'voucher_code', type: 'varchar', length: 50, unique: true })
  voucherCode: string;

  @Column({ name: 'tokens_deducted', type: 'int' })
  tokensDeducted: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'redeemed_at' })
  redeemedAt: Date;
}

