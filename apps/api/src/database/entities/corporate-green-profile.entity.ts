import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { GreenBadgeTier } from '@ecoride/contracts';

@Entity({ name: 'corporate_green_profiles' })
export class CorporateGreenProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 120, unique: true })
  employeeId: string;

  @Column({ name: 'corporate_account_id', type: 'varchar', length: 120 })
  corporateAccountId: string;

  @Column({ name: 'total_electric_km', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalElectricKm: number;

  @Column({ name: 'total_kg_co2_saved', type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalKgCo2Saved: number;

  @Column({
    name: 'current_tier',
    type: 'enum',
    enum: GreenBadgeTier,
    default: GreenBadgeTier.BRONZE_COMMUTER,
  })
  currentTier: GreenBadgeTier;

  @Column({ name: 'green_points', type: 'int', default: 0 })
  greenPoints: number;

  @Column({ name: 'unlocked_badges', type: 'simple-array', default: '' })
  unlockedBadges: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

