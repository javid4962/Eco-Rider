import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('gps_multipath_filter_logs')
export class GpsMultipathFilterLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'filtered_latitude', type: 'numeric', precision: 10, scale: 7 })
  filteredLatitude: number;

  @Column({ name: 'filtered_longitude', type: 'numeric', precision: 10, scale: 7 })
  filteredLongitude: number;

  @Column({ name: 'is_multipath_detected', type: 'boolean', default: false })
  isMultipathDetected: boolean;

  @Column({ name: 'confidence_score', type: 'numeric', precision: 4, scale: 2 })
  confidenceScore: number;

  @Column({ name: 'canyon_zone_name', type: 'varchar', length: 120, nullable: true })
  canyonZoneName: string | null;

  @Column({ name: 'corrected_drift_meters', type: 'numeric', precision: 8, scale: 2, default: 0 })
  correctedDriftMeters: number;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;
}

