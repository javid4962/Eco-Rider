import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('split_payout_items')
export class SplitPayoutItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ name: 'recipient_role', type: 'varchar', length: 30 })
  recipientRole: string;

  @Column({ name: 'payout_method', type: 'varchar', length: 20, default: 'UPI' })
  payoutMethod: string;

  @Column({ name: 'payout_vpa_or_account', type: 'varchar', length: 100 })
  payoutVpaOrAccount: string;

  @Column({ name: 'amount_paise', type: 'int' })
  amountPaise: number;

  @Column({ name: 'utr_reference', type: 'varchar', length: 100, nullable: true })
  utrReference: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'PROCESSED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

