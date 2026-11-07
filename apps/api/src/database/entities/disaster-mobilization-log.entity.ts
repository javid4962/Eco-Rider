import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DisasterMobilizationStage } from '@ecoride/contracts';

@Entity({ name: 'disaster_mobilization_logs' })
export class DisasterMobilizationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_reference', type: 'varchar', length: 120, unique: true })
  incidentReference: string;

  @Column({ name: 'commanding_agency', type: 'varchar', length: 120 })
  commandingAgency: string;

  @Column({
    name: 'mobilization_stage',
    type: 'enum',
    enum: DisasterMobilizationStage,
    default: DisasterMobilizationStage.STANDBY_MONITORING,
  })
  mobilizationStage: DisasterMobilizationStage;

  @Column({ name: 'civilian_booking_paused', type: 'boolean', default: false })
  civilianBookingPaused: boolean;

  @Column({ name: 'total_requisitioned_vehicles', type: 'int', default: 0 })
  totalRequisitionedVehicles: number;

  @Column({ name: 'evacuated_citizens_count', type: 'int', default: 0 })
  evacuatedCitizensCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

