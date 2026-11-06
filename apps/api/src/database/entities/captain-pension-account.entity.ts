import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('captain_pension_accounts')
export class CaptainPensionAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'uuid', unique: true })
  captainId: string;

  @Column({ name: 'pran_number', type: 'varchar', length: 20, unique: true })
  pranNumber: string;

  @Column({ name: 'daily_contribution_paise', type: 'int', default: 2000 })
  dailyContributionPaise: number;

  @Column({ name: 'total_accumulated_paise', type: 'bigint', default: 0 })
  totalAccumulatedPaise: number;

  @Column({ name: 'total_days_contributed', type: 'int', default: 0 })
  totalDaysContributed: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;
}

