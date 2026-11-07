import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('solar_depot_microgrid_events')
export class SolarDepotMicrogridEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'depot_id', type: 'varchar', length: 120 })
  depotId: string;

  @Column({ name: 'source_mode', type: 'varchar', length: 64 })
  sourceMode: string;

  @Column({ name: 'grid_draw_kw', type: 'numeric', precision: 8, scale: 2 })
  gridDrawKw: number;

  @Column({ name: 'solar_bess_draw_kw', type: 'numeric', precision: 8, scale: 2 })
  solarBessDrawKw: number;

  @Column({ name: 'peak_shaved_kw', type: 'numeric', precision: 8, scale: 2 })
  peakShavedKw: number;

  @Column({ name: 'arbitrage_savings_paise', type: 'bigint' })
  arbitrageSavingsPaise: number;

  @Column({ name: 'is_peak_period', type: 'boolean', default: false })
  isPeakPeriod: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

