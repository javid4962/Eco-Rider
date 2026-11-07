import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ncmc_transit_transactions')
export class NcmcTransitTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'transaction_id', type: 'varchar', length: 120, unique: true })
  transactionId: string;

  @Index()
  @Column({ name: 'booking_id', type: 'varchar', length: 120 })
  bookingId: string;

  @Column({ name: 'rider_id', type: 'varchar', length: 120 })
  riderId: string;

  @Column({ name: 'card_identifier_hash', type: 'varchar', length: 128 })
  cardIdentifierHash: string;

  @Column({ name: 'card_type', type: 'varchar', length: 64 })
  cardType: string;

  @Column({ name: 'fare_paise', type: 'bigint' })
  farePaise: number;

  @Column({ name: 'clearinghouse_batch_id', type: 'varchar', length: 120 })
  clearinghouseBatchId: string;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: string;

  @CreateDateColumn({ name: 'authorized_at', type: 'timestamptz' })
  authorizedAt: Date;

  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true })
  settledAt: Date | null;
}

