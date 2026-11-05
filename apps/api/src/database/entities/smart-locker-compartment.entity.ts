import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('smart_locker_compartments')
export class SmartLockerCompartment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'locker_hub_id', type: 'varchar', length: 50 })
  lockerHubId: string;

  @Column({ name: 'compartment_number', type: 'varchar', length: 20 })
  compartmentNumber: string;

  @Column({ name: 'size', type: 'varchar', length: 20, default: 'MEDIUM' })
  size: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'AVAILABLE' })
  status: string;

  @Column({ name: 'current_consignment_id', type: 'varchar', length: 50, nullable: true })
  currentConsignmentId: string | null;

  @Column({ name: 'release_otp_hash', type: 'varchar', length: 100, nullable: true })
  releaseOtpHash: string | null;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
