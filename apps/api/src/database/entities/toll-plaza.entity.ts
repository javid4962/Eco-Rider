import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('toll_plazas')
export class TollPlaza {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'toll_code', type: 'varchar', length: 50, unique: true })
  tollCode: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'highway_code', type: 'varchar', length: 50 })
  highwayCode: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ name: 'geofence_radius_meters', type: 'int', default: 300 })
  geofenceRadiusMeters: number;

  @Column({ name: 'car_jeep_van_toll_paise', type: 'int' })
  carJeepVanTollPaise: number;

  @Column({ name: 'light_commercial_toll_paise', type: 'int' })
  lightCommercialTollPaise: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

