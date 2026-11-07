import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RoboticSwapStep } from '@ecoride/contracts';

@Entity('robotic_swap_sessions')
@Index('idx_robotic_swap_station_vehicle', ['swapStationId', 'vehicleId'])
export class RoboticSwapSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'swap_station_id', type: 'varchar', length: 64 })
  swapStationId: string;

  @Column({ name: 'bay_number', type: 'varchar', length: 32 })
  bayNumber: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Column({ name: 'depleted_pack_serial', type: 'varchar', length: 64 })
  depletedPackSerial: string;

  @Column({ name: 'fresh_pack_serial', type: 'varchar', length: 64 })
  freshPackSerial: string;

  @Column({
    name: 'current_step',
    type: 'enum',
    enum: RoboticSwapStep,
    default: RoboticSwapStep.INITIALIZING,
  })
  currentStep: RoboticSwapStep;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ name: 'torque_newton_meters_applied', type: 'float' })
  torqueNewtonMetersApplied: number;

  @Column({ name: 'locking_pins_engaged_count', type: 'int', default: 4 })
  lockingPinsEngagedCount: number;

  @Column({ name: 'canbus_handshake_ok', type: 'boolean', default: false })
  canbusHandshakeOk: boolean;

  @Column({ name: 'is_successful', type: 'boolean', default: false })
  isSuccessful: boolean;

  @Column({ name: 'fault_code', type: 'varchar', length: 64, nullable: true })
  faultCode?: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;
}

