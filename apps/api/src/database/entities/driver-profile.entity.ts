import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_driver_profiles_user_id', { unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.driverProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index('idx_driver_profiles_license', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'license_number' })
  licenseNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'badge_number' })
  badgeNumber?: string;

  @Index('idx_driver_profiles_status')
  @Column({ type: 'varchar', length: 30, default: 'PENDING', name: 'verification_status' })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'boolean', default: false, name: 'green_plate_permit_verified' })
  greenPlatePermitVerified!: boolean;

  @Column({ type: 'boolean', default: false, name: 'safety_training_completed' })
  safetyTrainingCompleted!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'visakhapatnam' })
  city!: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_vehicle_id' })
  assignedVehicleId?: string;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_vehicle_id' })
  assignedVehicle?: Vehicle;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5.0, name: 'rating_average' })
  ratingAverage!: number;

  @Column({ type: 'int', default: 0, name: 'total_trips' })
  totalTrips!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
