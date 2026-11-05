import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('speed_violation_incidents')
export class SpeedViolationIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 50 })
  zoneCode: string;

  @Column({ name: 'speed_limit_kmph', type: 'int' })
  speedLimitKmph: number;

  @Column({ name: 'actual_speed_kmph', type: 'int' })
  actualSpeedKmph: number;

  @Column({ name: 'excess_speed_kmph', type: 'int' })
  excessSpeedKmph: number;

  @Column({ name: 'safety_score_penalty', type: 'int', default: 5 })
  safetyScorePenalty: number;

  @Column({ name: 'warning_notice_telugu', type: 'text' })
  warningNoticeTelugu: string;

  @Column({ name: 'warning_notice_english', type: 'text' })
  warningNoticeEnglish: string;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

