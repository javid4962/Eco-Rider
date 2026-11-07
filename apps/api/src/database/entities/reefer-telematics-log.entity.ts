import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ReeferCargoCategory, ReeferCoolingStatus } from '@ecoride/contracts';

@Entity({ name: 'reefer_telematics_logs' })
export class ReeferTelematicsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'consignment_id', type: 'varchar', length: 120 })
  consignmentId: string;

  @Column({
    name: 'cargo_category',
    type: 'enum',
    enum: ReeferCargoCategory,
  })
  cargoCategory: ReeferCargoCategory;

  @Column({ name: 'target_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  targetTempCelsius: number;

  @Column({ name: 'current_internal_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  currentInternalTempCelsius: number;

  @Column({ name: 'ambient_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  ambientTempCelsius: number;

  @Column({ name: 'compressor_rpm', type: 'int', default: 2500 })
  compressorRpm: number;

  @Column({ name: 'battery_soc_percent', type: 'numeric', precision: 5, scale: 2 })
  batterySocPercent: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ReeferCoolingStatus,
    default: ReeferCoolingStatus.OPTIMAL,
  })
  status: ReeferCoolingStatus;

  @Column({ name: 'commanded_setpoint_celsius', type: 'numeric', precision: 5, scale: 2 })
  commandedSetpointCelsius: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

