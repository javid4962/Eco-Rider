import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('zone_demand_forecasts')
export class ZoneDemandForecast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_id', type: 'varchar', length: 50 })
  zoneId: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 150 })
  zoneName: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'forecast_window_start', type: 'timestamptz' })
  forecastWindowStart: Date;

  @Column({ name: 'forecast_window_end', type: 'timestamptz' })
  forecastWindowEnd: Date;

  @Column({ name: 'predicted_demand_level', type: 'varchar', length: 30 })
  predictedDemandLevel: string;

  @Column({ name: 'expected_rides_count', type: 'int' })
  expectedRidesCount: number;

  @Column({ name: 'current_available_captains', type: 'int' })
  currentAvailableCaptains: number;

  @Column({ name: 'deficit_or_surplus_captains', type: 'int' })
  deficitOrSurplusCaptains: number;

  @Column({ name: 'repositioning_incentive_paise', type: 'int', default: 0 })
  repositioningIncentivePaise: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

