import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('weather_condition_logs')
export class WeatherConditionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone', type: 'varchar', length: 100 })
  zone: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50, default: 'CLEAR' })
  eventType: string;

  @Column({ name: 'severity', type: 'varchar', length: 30, default: 'NORMAL' })
  severity: string;

  @Column({ name: 'ambient_temperature_celsius', type: 'decimal', precision: 4, scale: 1 })
  ambientTemperatureCelsius: number;

  @Column({ name: 'precipitation_mm_per_hour', type: 'decimal', precision: 5, scale: 2, default: 0 })
  precipitationMmPerHour: number;

  @Column({ name: 'wind_speed_kmph', type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  windSpeedKmph: number;

  @Column({ name: 'is_weather_hardship_active', type: 'boolean', default: false })
  isWeatherHardshipActive: boolean;

  @Column({ name: 'driver_allowance_multiplier', type: 'decimal', precision: 4, scale: 2, default: 1.0 })
  driverAllowanceMultiplier: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

