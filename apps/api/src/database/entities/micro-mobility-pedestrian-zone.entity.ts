import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PedestrianZoneCategory } from '@ecoride/contracts';

@Entity({ name: 'micro_mobility_pedestrian_zones' })
export class MicroMobilityPedestrianZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 64, unique: true })
  zoneCode: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 120 })
  zoneName: string;

  @Column({
    name: 'category',
    type: 'enum',
    enum: PedestrianZoneCategory,
  })
  category: PedestrianZoneCategory;

  @Column({ name: 'min_latitude', type: 'numeric', precision: 10, scale: 7 })
  minLatitude: number;

  @Column({ name: 'max_latitude', type: 'numeric', precision: 10, scale: 7 })
  maxLatitude: number;

  @Column({ name: 'min_longitude', type: 'numeric', precision: 10, scale: 7 })
  minLongitude: number;

  @Column({ name: 'max_longitude', type: 'numeric', precision: 10, scale: 7 })
  maxLongitude: number;

  @Column({ name: 'speed_limit_kmh', type: 'int', default: 12 })
  speedLimitKmh: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

