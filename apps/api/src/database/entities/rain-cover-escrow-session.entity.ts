import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rain_cover_escrow_sessions')
export class RainCoverEscrowSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'captain_id', type: 'varchar', length: 120 })
  captainId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'depot_hub_id', type: 'varchar', length: 120 })
  depotHubId: string;

  @Column({ name: 'deposit_paise', type: 'bigint' })
  depositPaise: number;

  @Column({ name: 'daily_rental_paise', type: 'bigint' })
  dailyRentalPaise: number;

  @Column({ name: 'accumulated_rental_paise', type: 'bigint', default: 0 })
  accumulatedRentalPaise: number;

  @Column({ name: 'refunded_deposit_paise', type: 'bigint', default: 0 })
  refundedDepositPaise: number;

  @Column({ name: 'status', type: 'varchar', length: 64 })
  status: string;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'returned_at', type: 'timestamptz', nullable: true })
  returnedAt: Date | null;
}
