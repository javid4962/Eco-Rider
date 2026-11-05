import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('speed_limit_zones')
export class SpeedLimitZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 50, unique: true })
  zoneCode: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 150 })
  zoneName: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'zone_type', type: 'varchar', length: 50 })
  zoneType: string;

  @Column({ name: 'max_speed_kmph', type: 'int' })
  maxSpeedKmph: number;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ name: 'radius_meters', type: 'int', default: 300 })
  radiusMeters: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

