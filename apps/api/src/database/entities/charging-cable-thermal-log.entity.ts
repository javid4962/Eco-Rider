import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('charging_cable_thermal_logs')
export class ChargingCableThermalLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'charger_bay_id', type: 'varchar', length: 120 })
  chargerBayId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'cable_temperature_celsius', type: 'numeric', precision: 5, scale: 2 })
  cableTemperatureCelsius: number;

  @Column({ name: 'ambient_temperature_celsius', type: 'numeric', precision: 5, scale: 2 })
  ambientTemperatureCelsius: number;

  @Column({ name: 'action_taken', type: 'varchar', length: 64 })
  actionTaken: string;

  @Column({ name: 'adjusted_amps', type: 'numeric', precision: 6, scale: 2 })
  adjustedAmps: number;

  @Column({ name: 'alert_level', type: 'varchar', length: 32 })
  alertLevel: string;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;
}
