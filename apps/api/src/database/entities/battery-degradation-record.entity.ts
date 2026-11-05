import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('battery_degradation_records')
export class BatteryDegradationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'battery_pack_serial', type: 'varchar', length: 100 })
  batteryPackSerial: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'initial_capacity_kwh', type: 'decimal', precision: 5, scale: 2 })
  initialCapacityKwh: number;

  @Column({ name: 'current_capacity_kwh', type: 'decimal', precision: 5, scale: 2 })
  currentCapacityKwh: number;

  @Column({ name: 'state_of_health_percent', type: 'decimal', precision: 5, scale: 2 })
  stateOfHealthPercent: number;

  @Column({ name: 'cycle_count', type: 'int', default: 0 })
  cycleCount: number;

  @Column({ name: 'projected_rul_months', type: 'int', default: 36 })
  projectedRulMonths: number;

  @Column({ name: 'second_life_recommended', type: 'boolean', default: false })
  secondLifeRecommended: boolean;

  @CreateDateColumn({ name: 'evaluated_at' })
  evaluatedAt: Date;
}

