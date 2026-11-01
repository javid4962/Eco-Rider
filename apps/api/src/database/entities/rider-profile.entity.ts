import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('rider_profiles')
export class RiderProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_rider_profiles_user_id', { unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.riderProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'CASH_OR_UPI',
    name: 'preferred_payment_mode',
  })
  preferredPaymentMode!: string;

  @Column({ type: 'text', nullable: true, name: 'default_pickup_notes' })
  defaultPickupNotes?: string;

  @Column({ type: 'boolean', default: false, name: 'accessibility_needs' })
  accessibilityNeeds!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
