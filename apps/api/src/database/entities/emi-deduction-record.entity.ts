import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emi_deduction_records')
export class EmiDeductionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'deduction_date', type: 'date' })
  deductionDate: string;

  @Column({ name: 'gross_earnings_paise', type: 'int' })
  grossEarningsPaise: number;

  @Column({ name: 'requested_emi_paise', type: 'int' })
  requestedEmiPaise: number;

  @Column({ name: 'actual_deducted_paise', type: 'int' })
  actualDeductedPaise: number;

  @Column({ name: 'escrow_transferred_paise', type: 'int' })
  escrowTransferredPaise: number;

  @Column({ name: 'capped_by_safety_rule', type: 'boolean', default: false })
  cappedBySafetyRule: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

