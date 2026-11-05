import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('toll_crossings')
export class TollCrossing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'toll_plaza_code', type: 'varchar', length: 50 })
  tollPlazaCode: string;

  @Column({ name: 'toll_plaza_name', type: 'varchar', length: 150 })
  tollPlazaName: string;

  @Column({ name: 'toll_amount_paise', type: 'int' })
  tollAmountPaise: number;

  @Column({ name: 'fastag_deduction_ref', type: 'varchar', length: 100, unique: true })
  fastagDeductionRef: string;

  @Column({ name: 'reimbursement_status', type: 'varchar', length: 30, default: 'REIMBURSED' })
  reimbursementStatus: string;

  @Column({ name: 'reimbursed_at', type: 'timestamp with time zone', nullable: true })
  reimbursedAt: Date | null;

  @CreateDateColumn({ name: 'detected_at' })
  detectedAt: Date;
}

