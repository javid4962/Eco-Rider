import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('pass_redemptions')
export class PassRedemption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_pass_redemptions_pass')
  @Column({ type: 'uuid', name: 'pass_id' })
  passId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'booking_id' })
  bookingId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'trip_id' })
  tripId?: string | null;

  @Index('idx_pass_redemptions_idempotency', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'idempotency_key' })
  idempotencyKey!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

