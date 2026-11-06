import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('captain_wellness_screenings')
export class CaptainWellnessScreening {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'screening_id', type: 'varchar', length: 50, unique: true })
  screeningId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'depot_id', type: 'uuid' })
  depotId: string;

  @Column({ name: 'blood_alcohol_content_mg_dl', type: 'decimal', precision: 4, scale: 2, default: 0.0 })
  bloodAlcoholContentMgDl: number;

  @Column({ name: 'pulse_oximeter_spo2_percent', type: 'int', default: 98 })
  pulseOximeterSpO2Percent: number;

  @Column({ name: 'heart_rate_bpm', type: 'int', default: 72 })
  heartRateBpm: number;

  @Column({ name: 'body_temperature_celsius', type: 'decimal', precision: 4, scale: 2, default: 36.8 })
  bodyTemperatureCelsius: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'PASSED' })
  status: string;

  @Column({ name: 'fit_for_duty', type: 'boolean', default: true })
  fitForDuty: boolean;

  @CreateDateColumn({ name: 'screened_at' })
  screenedAt: Date;
}

