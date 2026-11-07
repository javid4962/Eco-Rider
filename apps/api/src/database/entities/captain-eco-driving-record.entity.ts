import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EcoDrivingTier } from '@ecoride/contracts';

@Entity({ name: 'captain_eco_driving_records' })
export class CaptainEcoDrivingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 120 })
  captainId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'total_distance_km', type: 'numeric', precision: 8, scale: 2 })
  totalDistanceKm: number;

  @Column({ name: 'regen_energy_recovered_kwh', type: 'numeric', precision: 6, scale: 2 })
  regenEnergyRecoveredKwh: number;

  @Column({ name: 'energy_consumed_kwh', type: 'numeric', precision: 6, scale: 2 })
  energyConsumedKwh: number;

  @Column({ name: 'eco_score', type: 'int' })
  ecoScore: number;

  @Column({
    name: 'tier',
    type: 'enum',
    enum: EcoDrivingTier,
  })
  tier: EcoDrivingTier;

  @Column({ name: 'bonus_eligible', type: 'boolean', default: false })
  bonusEligible: boolean;

  @Column({ name: 'bonus_amount_paise', type: 'bigint', default: 0 })
  bonusAmountPaise: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

