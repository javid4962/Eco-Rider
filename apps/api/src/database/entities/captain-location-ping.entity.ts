import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DriverProfile } from './driver-profile.entity';
import { CaptainAvailabilityStatus } from '@ecoride/contracts';

@Entity('captain_location_pings')
export class CaptainLocationPing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_captain_pings_driver_id')
  @Column({ type: 'uuid', name: 'driver_profile_id' })
  driverProfileId!: string;

  @ManyToOne(() => DriverProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_profile_id' })
  driverProfile?: DriverProfile;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Index('idx_captain_pings_location_gist', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'location',
  })
  location!: string;

  @Column({ type: 'double precision', name: 'accuracy_meters' })
  accuracyMeters!: number;

  @Column({ type: 'double precision', nullable: true, name: 'heading_degrees' })
  headingDegrees?: number | null;

  @Column({ type: 'double precision', nullable: true, name: 'speed_kmph' })
  speedKmph?: number | null;

  @Column({ type: 'double precision', nullable: true, name: 'altitude_meters' })
  altitudeMeters?: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'battery_soc_percent' })
  batterySocPercent?: number | null;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'availability_status',
  })
  availabilityStatus!: CaptainAvailabilityStatus | string;

  @Column({ type: 'boolean', default: true, name: 'is_fresh' })
  isFresh!: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'recorded_at' })
  recordedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
