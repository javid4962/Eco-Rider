import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LockboxSecurityState } from '@ecoride/contracts';

@Entity({ name: 'high_value_lockboxes' })
export class HighValueLockbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consignment_id', type: 'varchar', length: 120, unique: true })
  consignmentId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'sender_phone', type: 'varchar', length: 32 })
  senderPhone: string;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 32 })
  receiverPhone: string;

  @Column({ name: 'sender_deposit_otp_hash', type: 'varchar', length: 128 })
  senderDepositOtpHash: string;

  @Column({ name: 'receiver_withdrawal_otp_hash', type: 'varchar', length: 128 })
  receiverWithdrawalOtpHash: string;

  @Column({ name: 'is_high_value_pharma', type: 'boolean', default: false })
  isHighValuePharma: boolean;

  @Column({
    name: 'security_state',
    type: 'enum',
    enum: LockboxSecurityState,
    default: LockboxSecurityState.SECURE_LOCKED,
  })
  securityState: LockboxSecurityState;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

