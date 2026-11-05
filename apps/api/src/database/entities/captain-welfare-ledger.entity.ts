import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('captain_welfare_ledger')
export class CaptainWelfareLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_type', type: 'varchar', length: 20 }) // CONTRIBUTION or DISBURSAL
  entryType: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ name: 'captain_id', type: 'uuid', nullable: true })
  captainId: string | null;

  @Column({ name: 'amount_paise', type: 'int' })
  amountPaise: number;

  @Column({ name: 'balance_after_paise', type: 'int' })
  balanceAfterPaise: number;

  @Column({ name: 'description', type: 'varchar', length: 255 })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

