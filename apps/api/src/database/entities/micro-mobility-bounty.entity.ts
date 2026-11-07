import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BountyStatus, NoParkingZoneCode } from '@ecoride/contracts';

@Entity({ name: 'micro_mobility_bounties' })
export class MicroMobilityBounty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'session_id', type: 'varchar', length: 120 })
  sessionId: string;

  @Column({
    name: 'zone_code',
    type: 'enum',
    enum: NoParkingZoneCode,
  })
  zoneCode: NoParkingZoneCode;

  @Column({ name: 'abandoned_latitude', type: 'numeric', precision: 10, scale: 7 })
  abandonedLatitude: number;

  @Column({ name: 'abandoned_longitude', type: 'numeric', precision: 10, scale: 7 })
  abandonedLongitude: number;

  @Column({ name: 'bounty_reward_paise', type: 'bigint', default: 7500 })
  bountyRewardPaise: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BountyStatus,
    default: BountyStatus.OPEN,
  })
  status: BountyStatus;

  @Column({ name: 'claimed_by_captain_id', type: 'varchar', length: 120, nullable: true })
  claimedByCaptainId: string | null;

  @Column({ name: 'docked_hub_id', type: 'varchar', length: 120, nullable: true })
  dockedHubId: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
