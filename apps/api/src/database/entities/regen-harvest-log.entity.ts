import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RegenStatus } from '@ecoride/contracts';

@Entity('regen_harvest_logs')
@Index('idx_regen_harvest_vehicle_slope', ['vehicleId', 'corridorSegment'])
export class RegenHarvestLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 64, nullable: true })
  tripId?: string;

  @Column({ name: 'corridor_segment', type: 'varchar', length: 128 })
  corridorSegment: string;

  @Column({ name: 'slope_grade_percent', type: 'float' })
  slopeGradePercent: number;

  @Column({ name: 'descent_distance_meters', type: 'float' })
  descentDistanceMeters: number;

  @Column({ name: 'entry_speed_kmh', type: 'float' })
  entrySpeedKmh: number;

  @Column({ name: 'exit_speed_kmh', type: 'float' })
  exitSpeedKmh: number;

  @Column({ name: 'regen_torque_nm', type: 'float' })
  regenTorqueNm: number;

  @Column({ name: 'energy_recuperated_watt_hours', type: 'float' })
  energyRecuperatedWattHours: number;

  @Column({ name: 'pack_soc_percent', type: 'float' })
  packSocPercent: number;

  @Column({ name: 'cell_max_temperature_c', type: 'float' })
  cellMaxTemperatureC: number;

  @Column({
    name: 'regen_status',
    type: 'enum',
    enum: RegenStatus,
    default: RegenStatus.OPTIMAL,
  })
  regenStatus: RegenStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
