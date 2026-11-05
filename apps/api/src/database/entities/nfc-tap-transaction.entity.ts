import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('nfc_tap_transactions')
export class NfcTapTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_uid_hash', type: 'varchar', length: 64 })
  cardUidHash: string;

  @Column({ name: 'station_code', type: 'varchar', length: 50 })
  stationCode: string;

  @Column({ name: 'fare_deducted_paise', type: 'int' })
  fareDeductedPaise: number;

  @Column({ name: 'remaining_balance_paise', type: 'int' })
  remainingBalancePaise: number;

  @Column({ name: 'gate_opened', type: 'boolean', default: true })
  gateOpened: boolean;

  @CreateDateColumn({ name: 'tapped_at' })
  tappedAt: Date;
}

