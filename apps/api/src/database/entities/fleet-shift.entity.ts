import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { FleetOrganization } from './fleet-organization.entity';
import { FleetShiftType, FleetShiftStatus } from '@ecoride/contracts';

@Entity('fleet_shifts')
@Check('chk_fleet_shifts_type', `"shift_type" IN ('MORNING', 'EVENING', 'NIGHT', 'CUSTOM')`)
@Check('chk_fleet_shifts_status', `"status" IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED')`)
export class FleetShift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_fleet_shifts_org_id')
  @Column({ type: 'uuid', name: 'fleet_organization_id' })
  fleetOrganizationId!: string;

  @ManyToOne(() => FleetOrganization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fleet_organization_id' })
  fleetOrganization?: FleetOrganization;

  @Index('idx_fleet_shifts_vehicle_id')
  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Index('idx_fleet_shifts_driver_id')
  @Column({ type: 'uuid', name: 'driver_id' })
  driverId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver?: User;

  @Column({
    type: 'varchar',
    length: 30,
    default: FleetShiftType.MORNING,
    name: 'shift_type',
  })
  shiftType!: FleetShiftType | string;

  @Column({ type: 'timestamptz', name: 'start_time' })
  startTime!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'end_time' })
  endTime?: Date | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 100.0,
    name: 'start_soc_percent',
  })
  startSocPercent!: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'end_soc_percent',
  })
  endSocPercent?: number | null;

  @Column({ type: 'int', default: 0, name: 'start_odometer_km' })
  startOdometerKm!: number;

  @Column({ type: 'int', nullable: true, name: 'end_odometer_km' })
  endOdometerKm?: number | null;

  @Column({ type: 'int', default: 0, name: 'total_trips' })
  totalTrips!: number;

  @Column({ type: 'bigint', default: 0, name: 'total_earnings_paise' })
  totalEarningsPaise!: number;

  @Index('idx_fleet_shifts_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: FleetShiftStatus.ACTIVE,
  })
  status!: FleetShiftStatus | string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

