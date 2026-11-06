import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pension_deduction_records')
export class PensionDeductionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'trip_id', type: 'uuid', nullable: true })
  tripId: string | null;

  @Column({ name: 'deduction_amount_paise', type: 'int' })
  deductionAmountPaise: number;

  @Column({ name: 'accumulated_balance_after_paise', type: 'bigint' })
  accumulatedBalanceAfterPaise: number;

  @CreateDateColumn({ name: 'deducted_at' })
  deductedAt: Date;
}

