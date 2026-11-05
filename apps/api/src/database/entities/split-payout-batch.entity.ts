import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('split_payout_batches')
export class SplitPayoutBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'total_gross_fare_paise', type: 'int' })
  totalGrossFarePaise: number;

  @Column({ name: 'captain_share_paise', type: 'int' })
  captainSharePaise: number;

  @Column({ name: 'fleet_owner_share_paise', type: 'int', default: 0 })
  fleetOwnerSharePaise: number;

  @Column({ name: 'platform_fee_paise', type: 'int' })
  platformFeePaise: number;

  @Column({ name: 'gst_paise', type: 'int' })
  gstPaise: number;

  @Column({ name: 'disbursed_items', type: 'jsonb' })
  disbursedItems: any[];

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}

