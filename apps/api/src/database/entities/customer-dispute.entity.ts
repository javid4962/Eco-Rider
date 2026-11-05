import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customer_disputes')
export class CustomerDispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number', type: 'varchar', length: 50, unique: true })
  ticketNumber: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'complainant_user_id', type: 'uuid' })
  complainantUserId: string;

  @Column({ name: 'complainant_role', type: 'varchar', length: 20 })
  complainantRole: string;

  @Column({ name: 'category', type: 'varchar', length: 50 })
  category: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'claimed_amount_paise', type: 'int', nullable: true })
  claimedAmountPaise: number | null;

  @Column({ name: 'auto_refund_applied_paise', type: 'int', nullable: true })
  autoRefundAppliedPaise: number | null;

  @Column({ name: 're_metred_variance_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  reMetredVariancePercent: number | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'OPEN' })
  status: string;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

