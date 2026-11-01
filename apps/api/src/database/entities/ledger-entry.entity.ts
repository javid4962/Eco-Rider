import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Check } from 'typeorm';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';

@Entity('ledger_entries')
@Check(`"entry_type" IN ('DEBIT', 'CREDIT')`)
@Check(`"amount_paise" > 0`)
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_ledger_idempotency')
  @Column({ type: 'varchar', length: 100, unique: true, name: 'idempotency_key' })
  idempotencyKey!: string;

  @Column({ type: 'uuid', nullable: true, name: 'booking_id' })
  bookingId?: string;

  @Column({ type: 'varchar', length: 100, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'varchar', length: 20, name: 'entry_type' })
  entryType!: LedgerEntryType;

  @Column({ type: 'bigint', name: 'amount_paise' })
  amountPaise!: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
