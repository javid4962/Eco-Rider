import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { FleetOrganizationStatus } from '@ecoride/contracts';

@Entity('fleet_organizations')
@Check('chk_fleet_organizations_status', `"status" IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')`)
export class FleetOrganization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_fleet_orgs_owner_id')
  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('idx_fleet_orgs_reg_number', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'business_registration_number' })
  businessRegistrationNumber!: string;

  @Index('idx_fleet_orgs_city')
  @Column({ type: 'varchar', length: 50, default: 'visakhapatnam' })
  city!: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_phone' })
  contactPhone!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contact_email' })
  contactEmail?: string | null;

  @Index('idx_fleet_orgs_payout_acc', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'payout_account_id' })
  payoutAccountId!: string;

  @Index('idx_fleet_orgs_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: FleetOrganizationStatus.ACTIVE,
  })
  status!: FleetOrganizationStatus | string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.fleetOrganization)
  vehicles?: Vehicle[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

