import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OccOperationalPosture } from '@ecoride/contracts';

@Entity({ name: 'occ_posture_audits' })
export class OccPostureAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_code', type: 'varchar', length: 120 })
  incidentCode: string;

  @Column({
    name: 'previous_posture',
    type: 'enum',
    enum: OccOperationalPosture,
  })
  previousPosture: OccOperationalPosture;

  @Column({
    name: 'new_posture',
    type: 'enum',
    enum: OccOperationalPosture,
  })
  newPosture: OccOperationalPosture;

  @Column({ name: 'authorized_by', type: 'varchar', length: 120 })
  authorizedBy: string;

  @Column({ name: 'affected_vehicle_count', type: 'int', default: 0 })
  affectedVehicleCount: number;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
