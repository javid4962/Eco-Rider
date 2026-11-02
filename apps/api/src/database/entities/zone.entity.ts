import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import {
  ZoneOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  GeoJsonPolygon,
} from '@ecoride/contracts';

@Entity('zones')
@Check(
  'chk_zones_operational_status',
  `"operational_status" IN ('ACTIVE', 'PILOT', 'INACTIVE', 'SUSPENDED', 'DISABLED')`,
)
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_zones_city')
  @Column({ type: 'varchar', length: 50 })
  city!: string;

  @Index('idx_zones_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Index('idx_zones_operational_status')
  @Column({
    type: 'varchar',
    length: 30,
    name: 'operational_status',
    default: ZoneOperationalStatus.DISABLED,
  })
  operationalStatus!: ZoneOperationalStatus | string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'evidence_reference' })
  evidenceReference?: string | null;

  @Index('idx_zones_permit_expiry')
  @Column({ type: 'timestamptz', nullable: true, name: 'permit_expires_at' })
  permitExpiresAt?: Date | null;

  @Column({
    type: 'jsonb',
    name: 'category_switches',
    default: () => `'${JSON.stringify(DEFAULT_DISABLED_CATEGORY_SWITCHES)}'::jsonb`,
  })
  categorySwitches!: Record<string, boolean>;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary!: GeoJsonPolygon | string | object;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 6,
    nullable: true,
    name: 'center_latitude',
  })
  centerLatitude?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 6,
    nullable: true,
    name: 'center_longitude',
  })
  centerLongitude?: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
