import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lost_item_custody')
export class LostItemCustody {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tracking_barcode', type: 'varchar', length: 50, unique: true })
  trackingBarcode: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'depot_id', type: 'uuid', nullable: true })
  depotId: string | null;

  @Column({ name: 'vault_locker_number', type: 'varchar', length: 20, nullable: true })
  vaultLockerNumber: string | null;

  @Column({ name: 'item_category', type: 'varchar', length: 50 })
  itemCategory: string;

  @Column({ name: 'description', type: 'varchar', length: 255 })
  description: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'LOGGED_BY_CAPTAIN' })
  status: string;

  @Column({ name: 'claim_verification_otp_hash', type: 'varchar', length: 100, nullable: true })
  claimVerificationOtpHash: string | null;

  @CreateDateColumn({ name: 'logged_at' })
  loggedAt: Date;

  @Column({ name: 'returned_at', type: 'timestamp with time zone', nullable: true })
  returnedAt: Date | null;
}
