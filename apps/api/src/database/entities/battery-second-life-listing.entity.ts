import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SecondLifeGrade, SecondLifeAuctionStatus } from '@ecoride/contracts';

@Entity('battery_second_life_listings')
@Index('idx_second_life_pack_grade', ['packSerial', 'grade'])
export class BatterySecondLifeListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pack_serial', type: 'varchar', length: 64 })
  packSerial!: string;

  @Column({ name: 'original_capacity_kwh', type: 'double precision' })
  originalCapacityKwh!: number;

  @Column({ name: 'current_soh_percent', type: 'double precision' })
  currentSohPercent!: number;

  @Column({ name: 'cycle_count', type: 'integer' })
  cycleCount!: number;

  @Column({ name: 'remaining_capacity_kwh', type: 'double precision' })
  remainingCapacityKwh!: number;

  @Column({ name: 'grade', type: 'varchar', length: 64 })
  grade!: SecondLifeGrade;

  @Column({ name: 'status', type: 'varchar', length: 32, default: SecondLifeAuctionStatus.LISTED })
  status!: SecondLifeAuctionStatus;

  @Column({ name: 'estimated_salvage_valuation_paise', type: 'bigint' })
  estimatedSalvageValuationPaise!: number;

  @Column({ name: 'recommended_stationary_bess_depot', type: 'varchar', length: 64 })
  recommendedStationaryBessDepot!: string;

  @CreateDateColumn({ name: 'evaluated_at', type: 'timestamptz' })
  evaluatedAt!: Date;
}
