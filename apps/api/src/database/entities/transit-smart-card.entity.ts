import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transit_smart_cards')
export class TransitSmartCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_uid_hash', type: 'varchar', length: 64, unique: true })
  cardUidHash: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'card_type', type: 'varchar', length: 50 })
  cardType: string;

  @Column({ name: 'linked_wallet_balance_paise', type: 'int', default: 20000 })
  linkedWalletBalancePaise: number; // ₹200.00 default balance

  @Column({ name: 'last_tap_station_code', type: 'varchar', length: 50, nullable: true })
  lastTapStationCode: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
}

