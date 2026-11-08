import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { GridTariffPeriod, DiscomProvider } from '@ecoride/contracts';

@Entity('grid_peak_tariff_logs')
@Index('idx_grid_tariff_depot_period', ['depotId', 'tariffPeriod'])
export class GridPeakTariffLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'depot_id', type: 'varchar', length: 64 })
  depotId!: string;

  @Column({ name: 'discom', type: 'varchar', length: 32 })
  discom!: DiscomProvider;

  @Column({ name: 'current_hour_of_day', type: 'integer' })
  currentHourOfDay!: number;

  @Column({ name: 'active_charger_draw_kw', type: 'double precision' })
  activeChargerDrawKw!: number;

  @Column({ name: 'base_tariff_paise_per_kwh', type: 'integer' })
  baseTariffPaisePerKwh!: number;

  @Column({ name: 'effective_rate_paise_per_kwh', type: 'integer' })
  effectiveRatePaisePerKwh!: number;

  @Column({ name: 'peak_surcharge_paise_per_kwh', type: 'integer' })
  peakSurchargePaisePerKwh!: number;

  @Column({ name: 'corridor_surge_multiplier', type: 'double precision' })
  corridorSurgeMultiplier!: number;

  @Column({ name: 'tariff_period', type: 'varchar', length: 32 })
  tariffPeriod!: GridTariffPeriod;

  @Column({ name: 'is_peak_surge_active', type: 'boolean', default: false })
  isPeakSurgeActive!: boolean;

  @Column({ name: 'throttle_advisory', type: 'varchar', length: 255 })
  throttleAdvisory!: string;

  @CreateDateColumn({ name: 'evaluated_at', type: 'timestamptz' })
  evaluatedAt!: Date;
}

