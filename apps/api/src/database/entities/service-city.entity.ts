import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { CityOperationalStatus, DEFAULT_DISABLED_CATEGORY_SWITCHES } from '@ecoride/contracts';

@Entity('service_cities')
@Check(
  'chk_service_cities_status',
  `"operational_status" IN ('ACTIVE', 'PILOT', 'INACTIVE', 'SUSPENDED', 'DISABLED')`,
)
export class ServiceCity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_service_cities_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'Andhra Pradesh' })
  state!: string;

  @Index('idx_service_cities_status')
  @Column({
    type: 'varchar',
    length: 30,
    name: 'operational_status',
    default: CityOperationalStatus.DISABLED,
  })
  operationalStatus!: CityOperationalStatus | string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'evidence_reference' })
  evidenceReference?: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'permit_expires_at' })
  permitExpiresAt?: Date | null;

  @Column({
    type: 'jsonb',
    name: 'category_switches',
    default: () => `'${JSON.stringify(DEFAULT_DISABLED_CATEGORY_SWITCHES)}'::jsonb`,
  })
  categorySwitches!: Record<string, boolean>;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 6,
    name: 'center_latitude',
    default: 17.6868,
  })
  centerLatitude!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 6,
    name: 'center_longitude',
    default: 83.2185,
  })
  centerLongitude!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

