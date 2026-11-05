import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('battery_packs')
export class BatteryPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true })
  serialNumber: string;

  @Column({ name: 'model', type: 'varchar', length: 50 })
  model: string;

  @Column({ name: 'capacity_kwh', type: 'decimal', precision: 5, scale: 2 })
  capacityKwh: number;

  @Column({ name: 'current_soc_percent', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  currentSocPercent: number;

  @Column({ name: 'state_of_health_percent', type: 'decimal', precision: 5, scale: 2, default: 98.0 })
  stateOfHealthPercent: number;

  @Column({ name: 'cycle_count', type: 'int', default: 0 })
  cycleCount: number;

  @Column({ name: 'temperature_celsius', type: 'decimal', precision: 4, scale: 1, default: 32.0 })
  temperatureCelsius: number;

  @Column({ name: 'health_status', type: 'varchar', length: 30, default: 'EXCELLENT' })
  healthStatus: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string | null;

  @Column({ name: 'assigned_vehicle_id', type: 'uuid', nullable: true })
  assignedVehicleId: string | null;

  @Column({ name: 'is_ready_for_swap', type: 'boolean', default: true })
  isReadyForSwap: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

