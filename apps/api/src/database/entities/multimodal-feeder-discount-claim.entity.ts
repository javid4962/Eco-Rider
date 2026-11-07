import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('multimodal_feeder_discount_claims')
export class MultimodalFeederDiscountClaimEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'claim_id', type: 'varchar', length: 120, unique: true })
  claimId: string;

  @Index()
  @Column({ name: 'booking_id', type: 'varchar', length: 120 })
  bookingId: string;

  @Column({ name: 'rider_id', type: 'varchar', length: 120 })
  riderId: string;

  @Column({ name: 'transit_hub_id', type: 'varchar', length: 120 })
  transitHubId: string;

  @Column({ name: 'discount_paise', type: 'bigint' })
  discountPaise: number;

  @CreateDateColumn({ name: 'claimed_at', type: 'timestamptz' })
  claimedAt: Date;
}
