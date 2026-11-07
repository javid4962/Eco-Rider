import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FloodRiskSeverity } from '@ecoride/contracts';

@Entity({ name: 'flood_depth_assessments' })
export class FloodDepthAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'corridor_segment_id', type: 'varchar', length: 120 })
  corridorSegmentId: string;

  @Column({ name: 'sensor_location', type: 'varchar', length: 120 })
  sensorLocation: string;

  @Column({ name: 'water_depth_mm', type: 'int' })
  waterDepthMm: number;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  @Column({
    name: 'severity',
    type: 'enum',
    enum: FloodRiskSeverity,
    default: FloodRiskSeverity.SAFE_DRY,
  })
  severity: FloodRiskSeverity;

  @Column({ name: 'is_corridor_closed', type: 'boolean', default: false })
  isCorridorClosed: boolean;

  @Column({ name: 'recommended_detour', type: 'varchar', length: 255, nullable: true })
  recommendedDetour: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

