import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PayoutItemStatus, SettlementRecipientType } from '@ecoride/contracts';

@Entity('payout_items')
export class PayoutItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_payout_items_batch')
  @Column({ type: 'uuid', name: 'batch_id' })
  batchId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SettlementRecipientType.CAPTAIN,
    name: 'recipient_type',
  })
  recipientType!: SettlementRecipientType | string;

  @Index('idx_payout_items_recipient')
  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId!: string;

  @Column({ type: 'varchar', length: 100, name: 'payout_account_id' })
  payoutAccountId!: string;

  @Column({ type: 'bigint', name: 'gross_earnings_paise' })
  grossEarningsPaise!: number;

  @Column({ type: 'bigint', default: 0, name: 'cash_collected_offset_paise' })
  cashCollectedOffsetPaise!: number;

  @Column({ type: 'bigint', name: 'net_disbursal_paise' })
  netDisbursalPaise!: number;

  @Column({ type: 'bigint', default: 0, name: 'escrow_reserve_paise' })
  escrowReservePaise!: number;

  @Index('idx_payout_items_status')
  @Column({
    type: 'varchar',
    length: 50,
    default: PayoutItemStatus.PENDING,
    name: 'status',
  })
  status!: PayoutItemStatus | string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'gateway_payout_id' })
  gatewayPayoutId?: string | null;

  @Index('idx_payout_items_idempotency', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'idempotency_key' })
  idempotencyKey!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

