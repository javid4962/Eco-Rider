import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import type { RiderProfile } from './rider-profile.entity';
import type { DriverProfile } from './driver-profile.entity';
import type { Session } from './session.entity';
import type { Consent } from './consent.entity';
import type { SavedLocation } from './saved-location.entity';
import type { DataDeletionRequest } from './data-deletion-request.entity';

export type UserRole =
  | 'RIDER'
  | 'CAPTAIN'
  | 'SUPPORT'
  | 'FINANCE'
  | 'FLEET'
  | 'OPERATOR'
  | 'SUPER_ADMIN'
  | 'DISPATCHER'
  | 'FLEET_OWNER'
  | 'FINANCE_ADMIN'
  | 'SAFETY_OFFICER'
  | 'INSTITUTION_REP'
  | string;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_users_phone')
  @Column({ type: 'varchar', length: 20, unique: true })
  phone!: string;

  @Index('idx_users_email')
  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email?: string;

  @Index('idx_users_role')
  @Column({ type: 'varchar', length: 30 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToOne('RiderProfile', (profile: RiderProfile) => profile.user)
  riderProfile?: RiderProfile;

  @OneToOne('DriverProfile', (profile: DriverProfile) => profile.user)
  driverProfile?: DriverProfile;

  @OneToMany('Session', (session: Session) => session.user)
  sessions?: Session[];

  @OneToMany('Consent', (consent: Consent) => consent.user)
  consents?: Consent[];

  @OneToMany('SavedLocation', (location: SavedLocation) => location.user)
  savedLocations?: SavedLocation[];

  @OneToMany('DataDeletionRequest', (req: DataDeletionRequest) => req.user)
  deletionRequests?: DataDeletionRequest[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
