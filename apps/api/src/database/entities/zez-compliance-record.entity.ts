import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('zez_compliance_records')
export class ZezComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_number', type: 'varchar', length: 50, unique: true })
  certificateNumber: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 50 })
  zoneCode: string;

  @Column({ name: 'authorized_access', type: 'boolean', default: true })
  authorizedAccess: boolean;

  @Column({ name: 'penalty_charged_paise', type: 'int', default: 0 })
  penaltyChargedPaise: number;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
}
