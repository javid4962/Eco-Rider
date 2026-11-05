import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('campus_geofences')
export class CampusGeofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campus_code', type: 'varchar', length: 50, unique: true })
  campusCode: string;

  @Column({ name: 'campus_name', type: 'varchar', length: 150 })
  campusName: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'boundary_geojson', type: 'jsonb' })
  boundaryGeoJson: Record<string, any>;

  @Column({ name: 'authorized_organizations', type: 'jsonb', default: () => "'[]'" })
  authorizedOrganizations: string[];

  @Column({ name: 'total_shuttles_active', type: 'int', default: 2 })
  totalShuttlesActive: number;

  @Column({ name: 'operating_hours', type: 'varchar', length: 50, default: '07:00 - 21:00' })
  operatingHours: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

