import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('carbon_token_wallets')
export class CarbonTokenWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'total_tokens_minted', type: 'int', default: 0 })
  totalTokensMinted: number;

  @Column({ name: 'total_tokens_redeemed', type: 'int', default: 0 })
  totalTokensRedeemed: number;

  @Column({ name: 'available_balance_tokens', type: 'int', default: 0 })
  availableBalanceTokens: number;

  @Column({ name: 'total_co2_avoided_kg', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCo2AvoidedKg: number;

  @Column({ name: 'tier_badge', type: 'varchar', length: 50, default: 'GREEN_COMMUTER' })
  tierBadge: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

