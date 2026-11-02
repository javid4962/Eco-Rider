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
import { FleetAssignmentStatus } from '@ecoride/contracts';

@Entity('fleet_vehicle_assignments')
@Check('chk_fleet_assignments_status', `"status" IN ('ACTIVE', 'COMPLETED', 'TERMINATED')`)
export class FleetVehicleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_fleet_assignments_org_id')
  @Column({ type: 'uuid', name: 'fleet_organization_id' })
  fleetOrganizationId!: string;

  @ManyToOne(() => FleetOrganization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fleet_organization_id' })
  fleetOrganization?: FleetOrganization;

  @Index('idx_fleet_assignments_vehicle_id')
  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @Index('idx_fleet_assignments_driver_id')
  @Column({ type: 'uuid', name: 'driver_id' })
  driverId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver?: User;

  @Column({ type: 'uuid', name: 'assigned_by_id' })
  assignedById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User;

  @Column({ type: 'timestamptz', name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'unassigned_at' })
  unassignedAt?: Date | null;

  @Index('idx_fleet_assignments_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: FleetAssignmentStatus.ACTIVE,
  })
  status!: FleetAssignmentStatus | string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'INITIAL_ASSIGNMENT',
    name: 'assignment_reason',
  })
  assignmentReason!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
