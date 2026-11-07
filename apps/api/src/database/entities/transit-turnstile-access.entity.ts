import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TurnstileGateStatus, TurnstileStationCode } from '@ecoride/contracts';

@Entity({ name: 'transit_turnstile_accesses' })
export class TransitTurnstileAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 128, unique: true })
  tokenHash: string;

  @Column({ name: 'booking_id', type: 'varchar', length: 120 })
  bookingId: string;

  @Column({ name: 'rider_id', type: 'varchar', length: 120 })
  riderId: string;

  @Column({
    name: 'station_code',
    type: 'enum',
    enum: TurnstileStationCode,
  })
  stationCode: TurnstileStationCode;

  @Column({ name: 'turnstile_id', type: 'varchar', length: 120, nullable: true })
  turnstileId: string | null;

  @Column({
    name: 'gate_status',
    type: 'enum',
    enum: TurnstileGateStatus,
    default: TurnstileGateStatus.ACCESS_DENIED,
  })
  gateStatus: TurnstileGateStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'scanned_at', type: 'timestamptz', nullable: true })
  scannedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
