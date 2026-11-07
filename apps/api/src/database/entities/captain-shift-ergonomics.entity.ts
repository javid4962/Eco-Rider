import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShiftDutyStatus } from '@ecoride/contracts';

@Entity({ name: 'captain_shift_ergonomics' })
export class CaptainShiftErgonomics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 120, unique: true })
  captainId: string;

  @Column({ name: 'continuous_driving_minutes', type: 'int', default: 0 })
  continuousDrivingMinutes: number;

  @Column({ name: 'total_shift_minutes', type: 'int', default: 0 })
  totalShiftMinutes: number;

  @Column({
    name: 'duty_status',
    type: 'enum',
    enum: ShiftDutyStatus,
    default: ShiftDutyStatus.ACTIVE_ON_DUTY,
  })
  dutyStatus: ShiftDutyStatus;

  @Column({ name: 'cooldown_expiry', type: 'timestamptz', nullable: true })
  cooldownExpiry: Date | null;

  @Column({ name: 'last_rest_hub_id', type: 'varchar', length: 120, nullable: true })
  lastRestHubId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

