import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('congestion_zones')
export class CongestionZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'zone_code', type: 'varchar', length: 64 })
  zoneCode: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 128 })
  zoneName: string;

  @Column({ type: 'varchar', length: 64 })
  city: string;

  @Column({ name: 'center_latitude', type: 'numeric', precision: 10, scale: 6 })
  centerLatitude: number;

  @Column({ name: 'center_longitude', type: 'numeric', precision: 10, scale: 6 })
  centerLongitude: number;

  @Column({ name: 'radius_meters', type: 'int', default: 1500 })
  radiusMeters: number;

  @Column({ name: 'base_congestion_fee_paise', type: 'int', default: 2500 })
  baseCongestionFeePaise: number;

  @Column({ name: 'max_multiplier', type: 'numeric', precision: 3, scale: 2, default: 2.0 })
  maxMultiplier: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
