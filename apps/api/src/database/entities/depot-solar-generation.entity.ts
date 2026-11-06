import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('depot_solar_generations')
export class DepotSolarGeneration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'depot_id', type: 'uuid' })
  depotId: string;

  @Column({ name: 'depot_name', type: 'varchar', length: 150 })
  depotName: string;

  @Column({ name: 'current_solar_output_kw', type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  currentSolarOutputKw: number;

  @Column({ name: 'grid_carbon_intensity_g_co2_kwh', type: 'int', default: 720 })
  gridCarbonIntensityGCo2Kwh: number;

  @Column({ name: 'green_energy_percentage', type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  greenEnergyPercentage: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

