import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RestStopLocation, VoucherStatus } from '@ecoride/contracts';

@Entity({ name: 'highway_rest_stop_vouchers' })
export class HighwayRestStopVoucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'voucher_code', type: 'varchar', length: 64, unique: true })
  voucherCode: string;

  @Column({ name: 'booking_id', type: 'varchar', length: 120 })
  bookingId: string;

  @Column({ name: 'rider_id', type: 'varchar', length: 120 })
  riderId: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 120 })
  captainId: string;

  @Column({
    name: 'location',
    type: 'enum',
    enum: RestStopLocation,
  })
  location: RestStopLocation;

  @Column({ name: 'value_paise', type: 'bigint' })
  valuePaise: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: VoucherStatus,
    default: VoucherStatus.ISSUED,
  })
  status: VoucherStatus;

  @Column({ name: 'merchant_id', type: 'varchar', length: 120, nullable: true })
  merchantId: string | null;

  @Column({ name: 'redeemed_at', type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
