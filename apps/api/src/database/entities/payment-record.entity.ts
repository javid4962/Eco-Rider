import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentGatewayType, PaymentMethod } from '@ecoride/contracts';

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_payment_records_booking')
  @Column({ type: 'uuid', name: 'booking_id' })
  bookingId!: string;

  @Index('idx_payment_records_rider')
  @Column({ type: 'uuid', name: 'rider_id' })
  riderId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: PaymentGatewayType.RAZORPAY,
    name: 'gateway',
  })
  gateway!: PaymentGatewayType | string;

  @Index('idx_payment_records_order', { unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'gateway_order_id' })
  gatewayOrderId?: string | null;

  @Index('idx_payment_records_payment')
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'gateway_payment_id' })
  gatewayPaymentId?: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: PaymentStatus.PENDING,
    name: 'status',
  })
  status!: PaymentStatus | string;

  @Column({ type: 'bigint', name: 'amount_paise' })
  amountPaise!: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod?: PaymentMethod | string | null;

  @Index('idx_payment_records_idempotency', { unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'idempotency_key' })
  idempotencyKey?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'error_code' })
  errorCode?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'error_description' })
  errorDescription?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

