import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cold_chain_telemetry_logs')
export class ColdChainTelemetryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipment_id', type: 'uuid' })
  shipmentId: string;

  @Column({ name: 'reefer_unit_id', type: 'varchar', length: 50 })
  reeferUnitId: string;

  @Column({ name: 'sensor_temp_celsius', type: 'decimal', precision: 4, scale: 1 })
  sensorTempCelsius: number;

  @Column({ name: 'humidity_percent', type: 'decimal', precision: 5, scale: 2 })
  humidityPercent: number;

  @Column({ name: 'compressor_active', type: 'boolean', default: true })
  compressorActive: boolean;

  @Column({ name: 'reefer_battery_soc_percent', type: 'decimal', precision: 5, scale: 2 })
  reeferBatterySocPercent: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

