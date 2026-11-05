import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('municipal_micro_geofences')
export class MunicipalMicroGeofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 50, unique: true })
  zoneCode: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'authority', type: 'varchar', length: 50, default: 'APCRDA' })
  authority: string;

  @Column({ name: 'rule_type', type: 'varchar', length: 50, default: 'MANDATORY_STAGING_BAY' })
  ruleType: string;

  @Column({ name: 'max_staging_vehicles', type: 'int', default: 10 })
  maxStagingVehicles: number;

  @Column({ name: 'current_staging_vehicles', type: 'int', default: 0 })
  currentStagingVehicles: number;

  @Column({ name: 'boundary_coordinates', type: 'jsonb' })
  boundaryCoordinates: [number, number][];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

