import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('anti_rollback_stall_events')
export class AntiRollbackStallEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'flyover_name', type: 'varchar', length: 120 })
  flyoverName: string;

  @Column({ name: 'rollback_detected', type: 'boolean', default: false })
  rollbackDetected: boolean;

  @Column({ name: 'severity', type: 'varchar', length: 64 })
  severity: string;

  @Column({ name: 'holding_torque_boost_nm', type: 'numeric', precision: 6, scale: 2 })
  holdingTorqueBoostNm: number;

  @Column({ name: 'hill_start_assist_active', type: 'boolean', default: false })
  hillStartAssistActive: boolean;

  @Column({ name: 'alert_issued', type: 'boolean', default: false })
  alertIssued: boolean;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;
}

