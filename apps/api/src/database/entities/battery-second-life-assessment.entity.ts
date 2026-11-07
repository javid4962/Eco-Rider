import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BatteryHealthGrade, SecondLifeDutyRating } from '@ecoride/contracts';

@Entity({ name: 'battery_second_life_assessments' })
export class BatterySecondLifeAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'battery_serial', type: 'varchar', length: 120, unique: true })
  batterySerial: string;

  @Column({ name: 'original_vehicle_id', type: 'varchar', length: 120 })
  originalVehicleId: string;

  @Column({ name: 'original_capacity_kwh', type: 'numeric', precision: 6, scale: 2 })
  originalCapacityKwh: number;

  @Column({ name: 'measured_capacity_kwh', type: 'numeric', precision: 6, scale: 2 })
  measuredCapacityKwh: number;

  @Column({ name: 'state_of_health_percent', type: 'numeric', precision: 5, scale: 2 })
  stateOfHealthPercent: number;

  @Column({ name: 'resistance_ratio', type: 'numeric', precision: 5, scale: 2 })
  resistanceRatio: number;

  @Column({
    name: 'health_grade',
    type: 'enum',
    enum: BatteryHealthGrade,
    default: BatteryHealthGrade.GRADE_B_SECOND_LIFE,
  })
  healthGrade: BatteryHealthGrade;

  @Column({
    name: 'assigned_duty',
    type: 'enum',
    enum: SecondLifeDutyRating,
    default: SecondLifeDutyRating.DEPOT_STATIONARY_STORAGE,
  })
  assignedDuty: SecondLifeDutyRating;

  @Column({ name: 'is_eligible_for_second_life', type: 'boolean', default: true })
  isEligibleForSecondLife: boolean;

  @Column({ name: 'recommended_max_crate', type: 'numeric', precision: 4, scale: 2, default: 0.5 })
  recommendedMaxCrate: number;

  @Column({ name: 'cycle_count', type: 'int', default: 0 })
  cycleCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
