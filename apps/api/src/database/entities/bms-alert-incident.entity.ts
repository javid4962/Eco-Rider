import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bms_alert_incidents')
export class BmsAlertIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'severity', type: 'varchar', length: 30 })
  severity: string;

  @Column({ name: 'issue', type: 'varchar', length: 255 })
  issue: string;

  @Column({ name: 'diagnostic_data', type: 'jsonb', default: () => "'{}'" })
  diagnosticData: Record<string, any>;

  @Column({ name: 'auto_lockout_applied', type: 'boolean', default: false })
  autoLockoutApplied: boolean;

  @CreateDateColumn({ name: 'alert_timestamp' })
  alertTimestamp: Date;
}

